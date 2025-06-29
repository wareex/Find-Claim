import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { itemsAPI, messagesAPI } from '../services/api';
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Clock, 
  MessageCircle, 
  ChevronLeft, 
  ChevronRight,
  Send
} from 'lucide-react';
import { formatDate, formatRelativeTime, getCategoryIcon } from '../utils/helpers';
import toast from 'react-hot-toast';

const ItemDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [message, setMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    fetchItemDetails();
  }, [id]);

  const fetchItemDetails = async () => {
    try {
      const response = await itemsAPI.getLostItem(id);
      setItem(response.data);
    } catch (error) {
      console.error('Failed to fetch item details:', error);
      toast.error('Failed to load item details');
      navigate('/find');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSendingMessage(true);
    try {
      await messagesAPI.sendMessage({
        receiver_id: item.user_id,
        item_id: item.id,
        content: message
      });
      
      toast.success('Message sent successfully!');
      setMessage('');
      setShowMessageModal(false);
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const nextImage = () => {
    if (item.images && item.images.length > 1) {
      setCurrentImageIndex((prev) => 
        prev === item.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (item.images && item.images.length > 1) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? item.images.length - 1 : prev - 1
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card">
            <div className="animate-pulse">
              <div className="aspect-video bg-gray-200 rounded-lg mb-6"></div>
              <div className="h-6 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Item not found</h2>
            <button onClick={() => navigate('/find')} className="btn-primary">
              Back to Search
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === item.user_id;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Images */}
          <div className="space-y-4">
            <div className="relative aspect-video bg-gray-100 rounded-xl overflow-hidden">
              {item.images && item.images.length > 0 ? (
                <>
                  <img
                    src={item.images[currentImageIndex]}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  
                  {item.images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                      >
                        <ChevronRight size={20} />
                      </button>
                      
                      {/* Image indicators */}
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                        {item.images.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`w-2 h-2 rounded-full transition-all ${
                              index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-6xl">{getCategoryIcon(item.category_id)}</span>
                </div>
              )}
            </div>

            {/* Thumbnail strip */}
            {item.images && item.images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto pb-2">
                {item.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                      index === currentImageIndex ? 'border-primary-500' : 'border-gray-200'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${item.title} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="badge-primary mb-2 inline-block">
                    {getCategoryIcon(item.category_id)} {item.category_id}
                  </span>
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                    {item.title}
                  </h1>
                </div>
                <span className={`badge ${
                  item.status === 'active' ? 'bg-green-100 text-green-800' :
                  item.status === 'found' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {item.status || 'Active'}
                </span>
              </div>

              <p className="text-gray-700 text-lg leading-relaxed mb-6">
                {item.description}
              </p>

              {/* Item Info */}
              <div className="space-y-4">
                <div className="flex items-center text-gray-600">
                  <MapPin size={20} className="mr-3 text-gray-400" />
                  <span className="font-medium">Lost at:</span>
                  <span className="ml-2">{item.location}</span>
                </div>

                <div className="flex items-center text-gray-600">
                  <Calendar size={20} className="mr-3 text-gray-400" />
                  <span className="font-medium">Date lost:</span>
                  <span className="ml-2">{formatDate(item.date_lost)}</span>
                </div>

                <div className="flex items-center text-gray-600">
                  <Clock size={20} className="mr-3 text-gray-400" />
                  <span className="font-medium">Reported:</span>
                  <span className="ml-2">{formatRelativeTime(item.created_at)}</span>
                </div>
              </div>
            </div>

            {/* Owner Info */}
            {item.user && (
              <div className="card bg-gray-50">
                <h3 className="font-semibold text-gray-900 mb-3">Reported by</h3>
                <div className="flex items-center space-x-3">
                  <img
                    src={item.user.avatar_url || '/api/placeholder/40/40'}
                    alt={item.user.name}
                    className="w-10 h-10 rounded-full border-2 border-primary-200"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{item.user.name}</p>
                    <p className="text-sm text-gray-600">Community member</p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            {!isOwner && (
              <div className="space-y-3">
                <button
                  onClick={() => setShowMessageModal(true)}
                  className="btn-primary w-full flex items-center justify-center space-x-2"
                >
                  <MessageCircle size={20} />
                  <span>Contact Owner</span>
                </button>
                
                <div className="card bg-blue-50 border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-2">💡 Found this item?</h4>
                  <p className="text-sm text-blue-800">
                    Click "Contact Owner" to send them a message. Be sure to describe where you found it and any identifying details.
                  </p>
                </div>
              </div>
            )}

            {isOwner && (
              <div className="card bg-green-50 border-green-200">
                <h4 className="font-medium text-green-900 mb-2">✅ This is your item</h4>
                <p className="text-sm text-green-800">
                  Check your messages regularly for people who might have found your item.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Contact {item.user?.name}
            </h3>
            
            <form onSubmit={handleSendMessage}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Hi! I think I found your item. Can you provide more details to confirm it's yours?"
                  required
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowMessageModal(false)}
                  className="btn-secondary flex-1"
                  disabled={sendingMessage}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingMessage || !message.trim()}
                  className="btn-primary flex-1 flex items-center justify-center space-x-2"
                >
                  {sendingMessage ? (
                    <div className="spinner w-4 h-4"></div>
                  ) : (
                    <>
                      <Send size={16} />
                      <span>Send</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemDetail;