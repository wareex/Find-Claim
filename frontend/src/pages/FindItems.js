import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { itemsAPI } from '../services/api';
import { 
  Search, 
  Filter, 
  MapPin, 
  Calendar, 
  Clock, 
  X,
  Grid,
  List,
  ChevronDown
} from 'lucide-react';
import { formatRelativeTime, getCategoryIcon, debounce } from '../utils/helpers';

const FindItems = () => {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    location: '',
    dateFrom: '',
    dateTo: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0
  });

  // Debounced search
  const debouncedSearch = debounce(fetchItems, 500);

  useEffect(() => {
    fetchCategories();
    fetchItems();
  }, []);

  useEffect(() => {
    debouncedSearch();
  }, [searchTerm, filters, pagination.page]);

  const fetchCategories = async () => {
    try {
      const response = await itemsAPI.getCategories();
      setCategories(response.data.categories);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(searchTerm && { search: searchTerm }),
        ...(filters.category && { category: filters.category }),
        ...(filters.location && { location: filters.location }),
      };

      const response = await itemsAPI.getLostItems(params);
      setItems(response.data.items);
      setPagination(prev => ({
        ...prev,
        total: response.data.total,
        pages: response.data.pages
      }));
    } catch (error) {
      console.error('Failed to fetch items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      location: '',
      dateFrom: '',
      dateTo: ''
    });
    setSearchTerm('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const hasActiveFilters = () => {
    return searchTerm || filters.category || filters.location || filters.dateFrom || filters.dateTo;
  };

  const ItemCard = ({ item, isListView = false }) => (
    <Link
      to={`/item/${item.id}`}
      className={`card-hover bg-white rounded-xl overflow-hidden ${
        isListView ? 'flex flex-row' : 'flex flex-col'
      }`}
    >
      <div className={`bg-gray-100 relative ${
        isListView ? 'w-48 h-32' : 'aspect-video w-full'
      }`}>
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
          <span className="badge bg-green-100 text-green-800 text-xs">
            {item.status || 'Active'}
          </span>
        </div>
      </div>
      
      <div className={`p-4 ${isListView ? 'flex-1' : ''}`}>
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">
          {item.title}
        </h3>
        <p className={`text-sm text-gray-600 mb-3 ${
          isListView ? 'line-clamp-2' : 'line-clamp-3'
        }`}>
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

  const EmptyState = () => (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">🔍</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        {hasActiveFilters() ? 'No items found' : 'No lost items yet'}
      </h3>
      <p className="text-gray-600 mb-6">
        {hasActiveFilters() 
          ? 'Try adjusting your search criteria'
          : 'Be the first to report a lost item!'
        }
      </p>
      {hasActiveFilters() ? (
        <button onClick={clearFilters} className="btn-primary">
          Clear Filters
        </button>
      ) : (
        <Link to="/report" className="btn-primary">
          Report Lost Item
        </Link>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Lost Items</h1>
          <p className="text-gray-600">
            Browse through reported lost items and help reunite them with their owners
          </p>
        </div>

        {/* Search & Controls */}
        <div className="card mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search size={20} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search items, descriptions, or locations..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="input-field pl-10 w-full"
              />
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`btn-outline flex items-center space-x-2 ${
                  hasActiveFilters() ? 'bg-primary-50 border-primary-300' : ''
                }`}
              >
                <Filter size={16} />
                <span>Filters</span>
                {hasActiveFilters() && (
                  <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
                )}
              </button>

              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${
                    viewMode === 'grid' ? 'bg-primary-500 text-white' : 'text-gray-600'
                  }`}
                >
                  <Grid size={16} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${
                    viewMode === 'list' ? 'bg-primary-500 text-white' : 'text-gray-600'
                  }`}
                >
                  <List size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="input-field"
                  >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.icon} {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    placeholder="Filter by location"
                    value={filters.location}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date From
                  </label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date To
                  </label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              {hasActiveFilters() && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={clearFilters}
                    className="btn-secondary flex items-center space-x-2"
                  >
                    <X size={16} />
                    <span>Clear All Filters</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Results Info */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-600">
            {loading ? (
              'Loading...'
            ) : (
              `${pagination.total} items found${searchTerm ? ` for "${searchTerm}"` : ''}`
            )}
          </p>
          
          {pagination.pages > 1 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.pages}
              </span>
            </div>
          )}
        </div>

        {/* Items Grid/List */}
        {loading ? (
          <div className={`${
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-4'
          }`}>
            {[...Array(8)].map((_, index) => (
              <div key={index} className={`card ${
                viewMode === 'list' ? 'flex flex-row' : ''
              }`}>
                <div className={`bg-gray-200 skeleton ${
                  viewMode === 'list' ? 'w-48 h-32' : 'aspect-video w-full'
                }`}></div>
                <div className={`p-4 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                  <div className="h-4 bg-gray-200 rounded mb-2 skeleton"></div>
                  <div className="h-3 bg-gray-200 rounded mb-4 skeleton"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded skeleton"></div>
                    <div className="flex justify-between">
                      <div className="h-3 bg-gray-200 rounded w-20 skeleton"></div>
                      <div className="h-3 bg-gray-200 rounded w-16 skeleton"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : items.length > 0 ? (
          <>
            <div className={`${
              viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                : 'space-y-4'
            }`}>
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <ItemCard item={item} isListView={viewMode === 'list'} />
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex justify-center mt-12">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  <div className="flex items-center space-x-1">
                    {[...Array(Math.min(pagination.pages, 5))].map((_, index) => {
                      const pageNum = index + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                          className={`w-10 h-10 rounded-lg font-medium ${
                            pagination.page === pageNum
                              ? 'bg-primary-500 text-white'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page === pagination.pages}
                    className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
};

export default FindItems;