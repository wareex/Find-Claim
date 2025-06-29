from fastapi import FastAPI, HTTPException, Depends, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timedelta
import os
import uuid
import jwt
import httpx
from motor.motor_asyncio import AsyncIOMotorClient
import base64
from PIL import Image
import io
import json
from bson import ObjectId

app = FastAPI(title="Lost & Found API", version="1.0.0")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database Configuration
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGO_URL)
db = client.lost_found_db

# Security
security = HTTPBearer()
JWT_SECRET = os.getenv("JWT_SECRET", "your-super-secret-jwt-key-change-in-production")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")

# Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    avatar_url: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ItemCategory(BaseModel):
    id: str
    name: str
    icon: str

class LostItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    description: str
    category_id: str
    location: str
    date_lost: datetime
    images: List[str] = []
    status: str = "active"  # active, found, closed
    created_at: datetime = Field(default_factory=datetime.utcnow)
    contact_info: Optional[str] = None

class Message(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sender_id: str
    receiver_id: str
    item_id: str
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    read: bool = False

# Categories Data
CATEGORIES = [
    {"id": "electronics", "name": "Electronics", "icon": "📱"},
    {"id": "clothing", "name": "Clothing", "icon": "👕"},
    {"id": "keys", "name": "Keys", "icon": "🔑"},
    {"id": "jewelry", "name": "Jewelry", "icon": "💍"},
    {"id": "bags", "name": "Bags & Wallets", "icon": "👜"},
    {"id": "documents", "name": "Documents", "icon": "📄"},
    {"id": "pets", "name": "Pets", "icon": "🐕"},
    {"id": "other", "name": "Other", "icon": "📦"}
]

# Helper Functions
def convert_objectid_to_str(obj):
    """Convert MongoDB ObjectId to string recursively"""
    if isinstance(obj, ObjectId):
        return str(obj)
    elif isinstance(obj, dict):
        return {key: convert_objectid_to_str(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [convert_objectid_to_str(item) for item in obj]
    else:
        return obj

async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def create_jwt_token(user_id: str) -> str:
    payload = {
        "user_id": user_id,
        "exp": datetime.utcnow() + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

async def verify_google_token(token: str) -> dict:
    """Verify Google OAuth token and return user info"""
    # Demo mode - accept any token that starts with 'mock-'
    if token.startswith('mock-'):
        return {
            "email": "demo@example.com",
            "name": "Demo User",
            "picture": "https://via.placeholder.com/150"
        }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://www.googleapis.com/oauth2/v1/userinfo?access_token={token}"
            )
            if response.status_code == 200:
                return response.json()
            else:
                raise HTTPException(status_code=401, detail="Invalid Google token")
    except Exception as e:
        raise HTTPException(status_code=401, detail="Failed to verify Google token")

def process_image(image_data: bytes) -> str:
    """Process and validate image, return base64 string"""
    try:
        # Open image with PIL
        image = Image.open(io.BytesIO(image_data))
        
        # Check image quality/size
        if image.width < 300 or image.height < 300:
            raise HTTPException(status_code=400, detail="Image too small. Minimum 300x300 pixels required.")
        
        # Resize if too large
        if image.width > 1200 or image.height > 1200:
            image.thumbnail((1200, 1200), Image.Resampling.LANCZOS)
        
        # Convert to RGB if needed
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Save as JPEG
        buffer = io.BytesIO()
        image.save(buffer, format='JPEG', quality=85)
        
        # Convert to base64
        image_base64 = base64.b64encode(buffer.getvalue()).decode()
        return f"data:image/jpeg;base64,{image_base64}"
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Image processing failed: {str(e)}")

# API Routes
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow()}

@app.post("/api/auth/google")
async def google_auth(token: str = Form(...)):
    """Authenticate user with Google OAuth token"""
    user_info = await verify_google_token(token)
    
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_info["email"]})
    
    if existing_user:
        user_id = existing_user["id"]
    else:
        # Create new user
        user = User(
            email=user_info["email"],
            name=user_info["name"],
            avatar_url=user_info.get("picture")
        )
        await db.users.insert_one(user.dict())
        user_id = user.id
    
    # Generate JWT token
    jwt_token = create_jwt_token(user_id)
    
    return {
        "token": jwt_token,
        "user": {
            "id": user_id,
            "email": user_info["email"],
            "name": user_info["name"],
            "avatar_url": user_info.get("picture")
        }
    }

@app.get("/api/categories")
async def get_categories():
    """Get all item categories"""
    return {"categories": CATEGORIES}

@app.post("/api/items/lost")
async def report_lost_item(
    title: str = Form(...),
    description: str = Form(...),
    category_id: str = Form(...),
    location: str = Form(...),
    date_lost: str = Form(...),
    images: List[UploadFile] = File(...),
    user_id: str = Depends(verify_token)
):
    """Report a lost item"""
    
    # Process images
    processed_images = []
    for image_file in images:
        if len(processed_images) >= 3:  # Limit to 3 images
            break
        
        image_data = await image_file.read()
        processed_image = process_image(image_data)
        processed_images.append(processed_image)
    
    # Create lost item
    lost_item = LostItem(
        user_id=user_id,
        title=title,
        description=description,
        category_id=category_id,
        location=location,
        date_lost=datetime.fromisoformat(date_lost.replace('Z', '+00:00')),
        images=processed_images
    )
    
    await db.lost_items.insert_one(lost_item.dict())
    
    return {"message": "Lost item reported successfully", "item_id": lost_item.id}

@app.get("/api/items/lost")
async def get_lost_items(
    category: Optional[str] = None,
    location: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 20
):
    """Get lost items with filtering and pagination"""
    
    query = {"status": "active"}
    
    if category:
        query["category_id"] = category
    
    if location:
        query["location"] = {"$regex": location, "$options": "i"}
    
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    
    skip = (page - 1) * limit
    
    items_cursor = db.lost_items.find(query).skip(skip).limit(limit)
    items = await items_cursor.to_list(length=limit)
    total = await db.lost_items.count_documents(query)
    
    # Convert ObjectId to string
    items = convert_objectid_to_str(items)
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    }

@app.get("/api/items/lost/{item_id}")
async def get_lost_item(item_id: str):
    """Get specific lost item details"""
    item = await db.lost_items.find_one({"id": item_id})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Get user info
    user = await db.users.find_one({"id": item["user_id"]})
    if user:
        user = convert_objectid_to_str(user)
        item["user"] = {"name": user["name"], "avatar_url": user.get("avatar_url")}
    else:
        item["user"] = None
    
    # Convert ObjectId to string
    item = convert_objectid_to_str(item)
    
    return item

@app.post("/api/messages")
async def send_message(
    receiver_id: str = Form(...),
    item_id: str = Form(...),
    content: str = Form(...),
    sender_id: str = Depends(verify_token)
):
    """Send a message about an item"""
    
    message = Message(
        sender_id=sender_id,
        receiver_id=receiver_id,
        item_id=item_id,
        content=content
    )
    
    await db.messages.insert_one(message.dict())
    
    return {"message": "Message sent successfully", "message_id": message.id}

@app.get("/api/messages")
async def get_messages(user_id: str = Depends(verify_token)):
    """Get user messages"""
    
    messages_cursor = db.messages.find({
        "$or": [
            {"sender_id": user_id},
            {"receiver_id": user_id}
        ]
    }).sort("created_at", -1)
    
    messages = await messages_cursor.to_list(length=100)
    
    # Convert ObjectId to string
    messages = convert_objectid_to_str(messages)
    
    # Group messages by conversation (item_id + other_user)
    conversations = {}
    for msg in messages:
        other_user_id = msg["receiver_id"] if msg["sender_id"] == user_id else msg["sender_id"]
        conv_key = f"{msg['item_id']}_{other_user_id}"
        
        if conv_key not in conversations:
            conversations[conv_key] = {
                "item_id": msg["item_id"],
                "other_user_id": other_user_id,
                "messages": [],
                "last_message": msg["created_at"]
            }
        
        conversations[conv_key]["messages"].append(msg)
    
    return {"conversations": list(conversations.values())}

@app.get("/api/profile")
async def get_profile(user_id: str = Depends(verify_token)):
    """Get user profile and their items"""
    
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get user's lost items
    lost_items_cursor = db.lost_items.find({"user_id": user_id})
    lost_items = await lost_items_cursor.to_list(length=100)
    
    # Convert ObjectId to string
    user = convert_objectid_to_str(user)
    lost_items = convert_objectid_to_str(lost_items)
    
    return {
        "user": user,
        "lost_items": lost_items,
        "stats": {
            "total_reported": len(lost_items),
            "active_items": len([item for item in lost_items if item["status"] == "active"]),
            "found_items": len([item for item in lost_items if item["status"] == "found"])
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)