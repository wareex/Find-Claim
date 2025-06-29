import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';

// Format date for display
export const formatDate = (date) => {
  const dateObj = new Date(date);
  
  if (isToday(dateObj)) {
    return `Today at ${format(dateObj, 'h:mm a')}`;
  } else if (isYesterday(dateObj)) {
    return `Yesterday at ${format(dateObj, 'h:mm a')}`;
  } else {
    return format(dateObj, 'MMM d, yyyy');
  }
};

// Format relative time
export const formatRelativeTime = (date) => {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

// Validate image file
export const validateImage = (file) => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Please upload a valid image file (JPEG, PNG, or WebP)',
    };
  }
  
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'Image size must be less than 5MB',
    };
  }
  
  return { valid: true };
};

// Convert file to base64
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

// Debounce function
export const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

// Truncate text
export const truncateText = (text, maxLength = 100) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

// Generate random ID
export const generateId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Format status
export const formatStatus = (status) => {
  const statusMap = {
    active: 'Active',
    found: 'Found',
    closed: 'Closed',
  };
  return statusMap[status] || status;
};

// Get status color
export const getStatusColor = (status) => {
  const colorMap = {
    active: 'bg-green-100 text-green-800',
    found: 'bg-blue-100 text-blue-800',
    closed: 'bg-gray-100 text-gray-800',
  };
  return colorMap[status] || 'bg-gray-100 text-gray-800';
};

// Category icons
export const getCategoryIcon = (categoryId) => {
  const iconMap = {
    electronics: '📱',
    clothing: '👕',
    keys: '🔑',
    jewelry: '💍',
    bags: '👜',
    documents: '📄',
    pets: '🐕',
    other: '📦',
  };
  return iconMap[categoryId] || '📦';
};

// Search filter
export const filterItems = (items, searchTerm, filters = {}) => {
  let filtered = [...items];
  
  // Text search
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter(item => 
      item.title.toLowerCase().includes(term) ||
      item.description.toLowerCase().includes(term) ||
      item.location.toLowerCase().includes(term)
    );
  }
  
  // Category filter
  if (filters.category) {
    filtered = filtered.filter(item => item.category_id === filters.category);
  }
  
  // Location filter
  if (filters.location) {
    filtered = filtered.filter(item => 
      item.location.toLowerCase().includes(filters.location.toLowerCase())
    );
  }
  
  // Date filter
  if (filters.dateFrom) {
    filtered = filtered.filter(item => 
      new Date(item.date_lost) >= new Date(filters.dateFrom)
    );
  }
  
  if (filters.dateTo) {
    filtered = filtered.filter(item => 
      new Date(item.date_lost) <= new Date(filters.dateTo)
    );
  }
  
  return filtered;
};

// Local storage helpers
export const storage = {
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Error getting from localStorage:', error);
      return defaultValue;
    }
  },
  
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error setting to localStorage:', error);
    }
  },
  
  remove: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  },
  
  clear: () => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  },
};

// Image compression
export const compressImage = (file, maxWidth = 800, quality = 0.8) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      const { width, height } = img;
      const ratio = Math.min(maxWidth / width, maxWidth / height);
      
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob(resolve, 'image/jpeg', quality);
    };
    
    img.src = URL.createObjectURL(file);
  });
};