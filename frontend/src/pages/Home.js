import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { itemsAPI } from '../services/api';
import { 
  Search, 
  PlusCircle, 
  TrendingUp, 
  Clock, 
  MapPin, 
  Eye,
  ChevronRight,
  Heart
} from 'lucide-react';
import { formatRelativeTime, getCategoryIcon } from '../utils/helpers';

const Home = () => {
  const { user } = useAuth();
  const [recentItems, setRecentItems] = useState([]);
  const [stats, setStats] = useState({
    totalItems: 0,
    recentItems: 0,
    activeUsers: 0,
    successStories: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentItems();
    fetchStats();
  }, []);

  const fetchRecentItems = async () => {
    try {
      const response = await itemsAPI.getLostItems({ limit: 6 });
      setRecentItems(response.data.items);
    } catch (error) {
      console.error('Failed to fetch recent items:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Mock stats for demo
      setStats({
        totalItems: 156,
        recentItems: 12,
        activeUsers: 89,
        successStories: 34
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const ActionCard = ({ to, icon: Icon, title, description, gradient, delay = 0 }) => (
    <Link
      to={to}
      className={`card-hover ${gradient} p-8 text-white relative overflow-hidden group`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <Icon size={32} className="text-white" />
          <ChevronRight size={24} className="text-white/70 group-hover:text-white group-hover:translate-x-1 transition-all duration-200" />
        </div>
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-white/90">{description}</p>
      </div>
      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
    </Link>
  );

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
          <span className="badge-primary">{getCategoryIcon(item.category_id)} {item.category_id}</span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">{item.title}</h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <MapPin size={14} />
            <span>{item.location}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock size={14} />
            <span>{formatRelativeTime(item.created_at)}</span>
          </div>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary-500 to-secondary-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 animate-fade-in-up">
              Welcome back, {user?.name?.split(' ')[0]}! 👋
            </h1>
            <p className="text-xl text-white/90 mb-8 animate-fade-in-up animation-delay-200">
              Help your community find what matters most
            </p>
            
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              <ActionCard
                to="/report"
                icon={PlusCircle}
                title="Report Lost Item"
                description="Lost something? Let the community help you find it"
                gradient="bg-gradient-to-r from-red-500 to-pink-500"
                delay={400}
              />
              <ActionCard
                to="/find"
                icon={Search}
                title="Find Items"
                description="Browse lost items and help reunite them with owners"
                gradient="bg-gradient-to-r from-blue-500 to-purple-500"
                delay={600}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          <StatCard
            icon={TrendingUp}
            value={stats.totalItems}
            label="Total Items"
            color="bg-gradient-to-r from-blue-500 to-blue-600"
          />
          <StatCard
            icon={Clock}
            value={stats.recentItems}
            label="This Week"
            color="bg-gradient-to-r from-green-500 to-green-600"
          />
          <StatCard
            icon={Eye}
            value={stats.activeUsers}
            label="Active Users"
            color="bg-gradient-to-r from-purple-500 to-purple-600"
          />
          <StatCard
            icon={Heart}
            value={stats.successStories}
            label="Success Stories"
            color="bg-gradient-to-r from-pink-500 to-pink-600"
          />
        </div>

        {/* Recent Items */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Recent Lost Items</h2>
            <Link
              to="/find"
              className="btn-outline flex items-center space-x-2"
            >
              <span>View All</span>
              <ChevronRight size={16} />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="card">
                  <div className="aspect-video bg-gray-200 rounded-lg mb-4 skeleton"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2 skeleton"></div>
                  <div className="h-3 bg-gray-200 rounded mb-4 skeleton"></div>
                  <div className="flex justify-between">
                    <div className="h-3 bg-gray-200 rounded w-20 skeleton"></div>
                    <div className="h-3 bg-gray-200 rounded w-16 skeleton"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : recentItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentItems.map((item, index) => (
                <div
                  key={item.id}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <ItemCard item={item} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No items yet</h3>
              <p className="text-gray-600 mb-6">Be the first to report a lost item!</p>
              <Link to="/report" className="btn-primary">
                Report Lost Item
              </Link>
            </div>
          )}
        </div>

        {/* Call to Action */}
        <div className="card bg-gradient-to-r from-primary-500 to-secondary-500 text-white text-center">
          <h3 className="text-2xl font-bold mb-4">Make a Difference Today</h3>
          <p className="text-lg text-white/90 mb-6">
            Every lost item has a story. Help write a happy ending.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/report" className="btn-secondary">
              Report Lost Item
            </Link>
            <Link to="/find" className="btn-outline border-white text-white hover:bg-white hover:text-primary-600">
              Browse Items
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;