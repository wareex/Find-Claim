import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { itemsAPI } from '../services/api';
import { validateImage } from '../utils/helpers';
import { Upload, X, Calendar, MapPin, Tag, FileText, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';

const ReportItem = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    location: '',
    date_lost: '',
  });
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await itemsAPI.getCategories();
      setCategories(response.data.categories);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    files.forEach(file => {
      const validation = validateImage(file);
      if (!validation.valid) {
        toast.error(validation.error);
        return;
      }
      
      if (images.length < 3) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setImages(prev => [...prev, {
            file,
            preview: e.target.result,
            id: Math.random().toString(36).substr(2, 9)
          }]);
        };
        reader.readAsDataURL(file);
      } else {
        toast.error('Maximum 3 images allowed');
      }
    });
  };

  const removeImage = (imageId) => {
    setImages(prev => prev.filter(img => img.id !== imageId));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('dragover');
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length > 0) {
      const event = { target: { files: imageFiles } };
      handleImageUpload(event);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.category_id) newErrors.category_id = 'Category is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (!formData.date_lost) newErrors.date_lost = 'Date lost is required';
    if (images.length === 0) newErrors.images = 'At least one image is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setUploading(true);
    
    try {
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('category_id', formData.category_id);
      submitData.append('location', formData.location);
      submitData.append('date_lost', formData.date_lost + 'T00:00:00Z');
      
      images.forEach((image, index) => {
        submitData.append('images', image.file);
      });

      await itemsAPI.reportLostItem(submitData);
      
      toast.success('Lost item reported successfully!');
      navigate('/');
    } catch (error) {
      console.error('Failed to report item:', error);
      toast.error('Failed to report item. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Report Lost Item</h1>
          <p className="text-gray-600">
            Provide as much detail as possible to help others identify your lost item
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <FileText className="mr-2" size={20} />
              Basic Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="form-label">
                  Item Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={`form-input ${errors.title ? 'border-red-300' : ''}`}
                  placeholder="e.g., Black leather wallet"
                />
                {errors.title && <p className="form-error">{errors.title}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="form-label">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className={`form-input ${errors.description ? 'border-red-300' : ''}`}
                  placeholder="Describe your item in detail: color, size, brand, distinguishing features, etc."
                />
                {errors.description && <p className="form-error">{errors.description}</p>}
              </div>

              <div>
                <label className="form-label">
                  <Tag className="inline mr-1" size={16} />
                  Category *
                </label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleInputChange}
                  className={`form-input ${errors.category_id ? 'border-red-300' : ''}`}
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </option>
                  ))}
                </select>
                {errors.category_id && <p className="form-error">{errors.category_id}</p>}
              </div>

              <div>
                <label className="form-label">
                  <Calendar className="inline mr-1" size={16} />
                  Date Lost *
                </label>
                <input
                  type="date"
                  name="date_lost"
                  value={formData.date_lost}
                  onChange={handleInputChange}
                  max={new Date().toISOString().split('T')[0]}
                  className={`form-input ${errors.date_lost ? 'border-red-300' : ''}`}
                />
                {errors.date_lost && <p className="form-error">{errors.date_lost}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="form-label">
                  <MapPin className="inline mr-1" size={16} />
                  Location Lost *
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className={`form-input ${errors.location ? 'border-red-300' : ''}`}
                  placeholder="e.g., Central Park, near the playground"
                />
                {errors.location && <p className="form-error">{errors.location}</p>}
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <ImageIcon className="mr-2" size={20} />
              Images * (Max 3)
            </h2>

            {/* Upload Area */}
            <div
              className={`upload-area ${errors.images ? 'border-red-300' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById('image-upload').click()}
            >
              <Upload size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-700 mb-2">
                Upload clear photos of your lost item
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Drag & drop images here, or click to browse
              </p>
              <p className="text-xs text-gray-400">
                PNG, JPG, WebP up to 5MB each
              </p>
              <input
                id="image-upload"
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
            {errors.images && <p className="form-error mt-2">{errors.images}</p>}

            {/* Image Previews */}
            {images.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Uploaded Images ({images.length}/3)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {images.map((image) => (
                    <div key={image.id} className="relative group">
                      <img
                        src={image.preview}
                        alt="Preview"
                        className="w-full h-32 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(image.id)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Tips */}
          <div className="card bg-blue-50 border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">
              💡 Tips for better results
            </h3>
            <ul className="text-sm text-blue-800 space-y-2">
              <li>• Include multiple clear photos from different angles</li>
              <li>• Mention any unique features, damages, or marks</li>
              <li>• Be specific about where you lost it</li>
              <li>• Include any sentimental value or urgency</li>
              <li>• Check your messages regularly for responses</li>
            </ul>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="btn-secondary"
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="btn-primary flex items-center space-x-2"
            >
              {uploading ? (
                <>
                  <div className="spinner w-4 h-4"></div>
                  <span>Reporting...</span>
                </>
              ) : (
                <>
                  <Upload size={16} />
                  <span>Report Lost Item</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportItem;