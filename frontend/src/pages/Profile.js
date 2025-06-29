import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { profileAPI } from '../services/api';
import { 
  User, 
  Package, 
  Clock, 
  CheckCircle, 
  MessageCircle,
  MapPin,
  Calendar,
  Eye,
  Edit3
} from 'lucide-react';
import { formatDate, formatRelativeTime, getCategoryIcon } from '../utils/helpers';

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('items');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await profileAPI.getProfile();
      setProfile(response.data);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, value, label, color }) => (
    <div className="card text-center">
      <div className={`inline-flex items-center justify-center w-12 h-12 ${color} rounded-xl mb-4`}>
        <Icon size={24} className="text-white" />
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-2">{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  );

  const ItemCard = ({ item }) => (
    <Link
      to={`/item/${item.id}`}
      className="card-hover bg-white rounded-xl overflow-hidden"
    >
      <div className="aspect-video bg-gray-100 relative">
        {item.images && item.images.length > 0 ? (
          <img
            src={item.images[0]}
            alt={item.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl">{getCategoryIcon(item.category_id)}</span>
          </div>
        )}
        <div className="absolute top-3 left-3">
          <span className="badge-primary text-xs">
            {getCategoryIcon(item.category_id)}
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <span className={`badge text-xs ${
            item.status === 'active' ? 'bg-green-100 text-green-800' :
            item.status === 'found' ? 'bg-blue-100 text-blue-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {item.status || 'Active'}
          </span>
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">
          {item.title}
        </h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {item.description}
        </p>
        
        <div className="space-y-2">
          <div className="flex items-center text-xs text-gray-500">
            <MapPin size={14} className="mr-1" />
            <span className="truncate">{item.location}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center">
              <Calendar size={14} className="mr-1" />
              <span>Lost: {new Date(item.date_lost).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center">
              <Clock size={14} className="mr-1" />
              <span>{formatRelativeTime(item.created_at)}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="card mb-8">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="card">
                  <div className="w-12 h-12 bg-gray-200 rounded-xl mx-auto mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="card mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
            <img
              src={user?.avatar_url || '/api/placeholder/80/80'}
              alt={user?.name}
              className="w-20 h-20 rounded-full border-4 border-primary-200"
            />
            
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {user?.name}
              </h1>
              <p className="text-gray-600 mb-4">
                {user?.email}
              </p>
              <div className="flex items-center text-sm text-gray-500">
                <User size={16} className="mr-1" />
                <span>Member since {formatDate(user?.created_at || new Date())}</span>
              </div>
            </div>
            
            <button className="btn-outline flex items-center space-x-2">
              <Edit3 size={16} />
              <span>Edit Profile</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        {profile && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard
              icon={Package}
              value={profile.stats.total_reported}
              label="Items Reported"
              color="bg-gradient-to-r from-blue-500 to-blue-600"
            />
            <StatCard
              icon={Clock}
              value={profile.stats.active_items}
              label="Active Items"
              color="bg-gradient-to-r from-green-500 to-green-600"
            />
            <StatCard
              icon={CheckCircle}
              value={profile.stats.found_items}
              label="Found Items"
              color="bg-gradient-to-r from-purple-500 to-purple-600"
            />
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('items')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'items'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Package size={16} className="inline mr-2" />
                My Items ({profile?.lost_items?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('messages')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'messages'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <MessageCircle size={16} className="inline mr-2" />
                Messages
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'items' && (
          <div>
            {profile?.lost_items && profile.lost_items.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Your Lost Items
                  </h2>
                  <Link to="/report" className="btn-primary">
                    Report New Item
                  </Link>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {profile.lost_items.map((item, index) => (
                    <div
                      key={item.id}
                      className="animate-fade-in-up"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <ItemCard item={item} />
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No items reported yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Start by reporting your first lost item
                </p>
                <Link to="/report" className="btn-primary">
                  Report Lost Item
                </Link>
              </div>
            )}
          </div>
        )}

        {activeTab === 'messages' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Messages</h2>
              <Link to="/messages" className="btn-outline flex items-center space-x-2">
                <Eye size={16} />
                <span>View All</span>
              </Link>
            </div>
            
            <div className="card text-center py-12">
              <MessageCircle size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Message Center
              </h3>
              <p className="text-gray-600 mb-6">
                View and manage all your conversations about lost items
              </p>
              <Link to="/messages" className="btn-primary">
                Go to Messages
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;