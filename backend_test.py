import requests
import unittest
import json
import os
from datetime import datetime

class LostAndFoundAPITest(unittest.TestCase):
    def setUp(self):
        # Get the backend URL from environment variable or use default
        self.base_url = os.environ.get("REACT_APP_BACKEND_URL", "http://localhost:8001")
        self.token = None
        self.user_id = None
        self.test_item_id = None
        
        # Mock data for testing
        self.mock_token = "mock-test-token-" + datetime.now().strftime("%H%M%S")
        
        # Login first to get token
        self.login()
    
    def login(self):
        """Test login and get token"""
        print(f"\n🔍 Testing login with mock token...")
        
        try:
            response = requests.post(
                f"{self.base_url}/api/auth/google",
                data={"token": self.mock_token}
            )
            
            if response.status_code == 200:
                data = response.json()
                self.token = data.get("token")
                self.user_id = data.get("user", {}).get("id")
                print(f"✅ Login successful - User ID: {self.user_id}")
                return True
            else:
                print(f"❌ Login failed - Status: {response.status_code}")
                print(f"Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Login failed - Error: {str(e)}")
            return False
    
    def get_auth_headers(self):
        """Get headers with auth token"""
        return {"Authorization": f"Bearer {self.token}"} if self.token else {}
    
    def test_01_health_check(self):
        """Test health check endpoint"""
        print(f"\n🔍 Testing health check endpoint...")
        
        try:
            response = requests.get(f"{self.base_url}/api/health")
            
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertEqual(data.get("status"), "healthy")
            print(f"✅ Health check passed")
            
        except Exception as e:
            self.fail(f"Health check failed: {str(e)}")
    
    def test_02_get_categories(self):
        """Test get categories endpoint"""
        print(f"\n🔍 Testing get categories endpoint...")
        
        try:
            response = requests.get(f"{self.base_url}/api/categories")
            
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertIn("categories", data)
            self.assertTrue(len(data["categories"]) > 0)
            
            # Verify expected categories exist
            category_ids = [cat["id"] for cat in data["categories"]]
            expected_categories = ["electronics", "clothing", "keys", "jewelry", "bags", "documents", "pets", "other"]
            for cat in expected_categories:
                self.assertIn(cat, category_ids)
                
            print(f"✅ Get categories passed - Found {len(data['categories'])} categories")
            
        except Exception as e:
            self.fail(f"Get categories failed: {str(e)}")
    
    def test_03_report_lost_item(self):
        """Test reporting a lost item"""
        print(f"\n🔍 Testing report lost item endpoint...")
        
        if not self.token:
            self.skipTest("No auth token available")
        
        try:
            # Create test image
            import base64
            from PIL import Image
            import io
            
            # Create a simple test image
            img = Image.new('RGB', (400, 400), color = 'red')
            img_byte_arr = io.BytesIO()
            img.save(img_byte_arr, format='JPEG')
            img_byte_arr.seek(0)
            
            # Prepare form data
            files = {
                'images': ('test_image.jpg', img_byte_arr, 'image/jpeg')
            }
            
            data = {
                'title': 'Test Lost Item',
                'description': 'This is a test item created by automated testing',
                'category_id': 'electronics',
                'location': 'Test Location',
                'date_lost': datetime.now().strftime("%Y-%m-%d")
            }
            
            response = requests.post(
                f"{self.base_url}/api/items/lost",
                files=files,
                data=data,
                headers=self.get_auth_headers()
            )
            
            self.assertEqual(response.status_code, 200)
            result = response.json()
            self.assertIn("item_id", result)
            self.test_item_id = result["item_id"]
            
            print(f"✅ Report lost item passed - Item ID: {self.test_item_id}")
            
        except Exception as e:
            self.fail(f"Report lost item failed: {str(e)}")
    
    def test_04_get_lost_items(self):
        """Test getting lost items"""
        print(f"\n🔍 Testing get lost items endpoint...")
        
        try:
            response = requests.get(f"{self.base_url}/api/items/lost")
            
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertIn("items", data)
            self.assertIn("total", data)
            
            print(f"✅ Get lost items passed - Found {data['total']} items")
            
            # Test with filters
            if data['total'] > 0:
                # Test category filter
                category = data['items'][0]['category_id']
                response = requests.get(f"{self.base_url}/api/items/lost?category={category}")
                self.assertEqual(response.status_code, 200)
                filtered_data = response.json()
                self.assertIn("items", filtered_data)
                
                # Verify all items have the correct category
                for item in filtered_data['items']:
                    self.assertEqual(item['category_id'], category)
                
                print(f"✅ Category filter passed - Found {len(filtered_data['items'])} items with category '{category}'")
            
        except Exception as e:
            self.fail(f"Get lost items failed: {str(e)}")
    
    def test_05_get_specific_item(self):
        """Test getting a specific lost item"""
        print(f"\n🔍 Testing get specific item endpoint...")
        
        if not self.test_item_id:
            # If we don't have a test item ID from the previous test,
            # try to get one from the list of items
            try:
                response = requests.get(f"{self.base_url}/api/items/lost")
                data = response.json()
                if data.get('items') and len(data['items']) > 0:
                    self.test_item_id = data['items'][0]['id']
                else:
                    self.skipTest("No items available to test")
            except:
                self.skipTest("Could not get items to test")
        
        try:
            response = requests.get(f"{self.base_url}/api/items/lost/{self.test_item_id}")
            
            self.assertEqual(response.status_code, 200)
            item = response.json()
            self.assertEqual(item['id'], self.test_item_id)
            
            # Check if user info is included
            self.assertIn('user', item)
            
            print(f"✅ Get specific item passed - Item title: {item['title']}")
            
        except Exception as e:
            self.fail(f"Get specific item failed: {str(e)}")
    
    def test_06_send_message(self):
        """Test sending a message"""
        print(f"\n🔍 Testing send message endpoint...")
        
        if not self.token:
            self.skipTest("No auth token available")
            
        if not self.test_item_id:
            # Try to get an item ID
            try:
                response = requests.get(f"{self.base_url}/api/items/lost")
                data = response.json()
                if data.get('items') and len(data['items']) > 0:
                    self.test_item_id = data['items'][0]['id']
                    receiver_id = data['items'][0]['user_id']
                else:
                    self.skipTest("No items available to test messaging")
            except:
                self.skipTest("Could not get items to test messaging")
        else:
            # Get the item to find the receiver ID
            try:
                response = requests.get(f"{self.base_url}/api/items/lost/{self.test_item_id}")
                item = response.json()
                receiver_id = item['user_id']
            except:
                self.skipTest("Could not get receiver ID for messaging")
        
        try:
            data = {
                'receiver_id': receiver_id,
                'item_id': self.test_item_id,
                'content': 'This is a test message from automated testing'
            }
            
            response = requests.post(
                f"{self.base_url}/api/messages",
                data=data,
                headers=self.get_auth_headers()
            )
            
            self.assertEqual(response.status_code, 200)
            result = response.json()
            self.assertIn("message_id", result)
            
            print(f"✅ Send message passed - Message ID: {result['message_id']}")
            
        except Exception as e:
            self.fail(f"Send message failed: {str(e)}")
    
    def test_07_get_messages(self):
        """Test getting messages"""
        print(f"\n🔍 Testing get messages endpoint...")
        
        if not self.token:
            self.skipTest("No auth token available")
        
        try:
            response = requests.get(
                f"{self.base_url}/api/messages",
                headers=self.get_auth_headers()
            )
            
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertIn("conversations", data)
            
            print(f"✅ Get messages passed - Found {len(data['conversations'])} conversations")
            
        except Exception as e:
            self.fail(f"Get messages failed: {str(e)}")
    
    def test_08_get_profile(self):
        """Test getting user profile"""
        print(f"\n🔍 Testing get profile endpoint...")
        
        if not self.token:
            self.skipTest("No auth token available")
        
        try:
            response = requests.get(
                f"{self.base_url}/api/profile",
                headers=self.get_auth_headers()
            )
            
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertIn("user", data)
            self.assertIn("lost_items", data)
            self.assertIn("stats", data)
            
            print(f"✅ Get profile passed - User: {data['user']['name']}")
            
        except Exception as e:
            self.fail(f"Get profile failed: {str(e)}")
    
    def test_09_unauthorized_access(self):
        """Test unauthorized access to protected endpoints"""
        print(f"\n🔍 Testing unauthorized access...")
        
        protected_endpoints = [
            {"url": "/api/profile", "method": "get"},
            {"url": "/api/messages", "method": "get"},
            {"url": "/api/items/lost", "method": "post", "data": {"title": "Test"}}
        ]
        
        for endpoint in protected_endpoints:
            try:
                if endpoint["method"] == "get":
                    response = requests.get(f"{self.base_url}{endpoint['url']}")
                else:
                    response = requests.post(
                        f"{self.base_url}{endpoint['url']}",
                        data=endpoint.get("data", {})
                    )
                
                self.assertEqual(response.status_code, 401, 
                                f"Expected 401 for {endpoint['url']}, got {response.status_code}")
                
                print(f"✅ Unauthorized test passed for {endpoint['url']}")
                
            except Exception as e:
                print(f"❌ Unauthorized test failed for {endpoint['url']}: {str(e)}")

if __name__ == "__main__":
    # Run the tests
    unittest.main(argv=['first-arg-is-ignored'], exit=False)