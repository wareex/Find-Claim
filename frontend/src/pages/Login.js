import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Search, Heart, Shield, Users } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  // Mock Google OAuth for demo purposes
  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      // In a real app, this would use Google OAuth
      // For demo purposes, we'll simulate a successful login
      const mockGoogleToken = 'mock-google-token-' + Math.random();
      await login(mockGoogleToken);
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Hero content */}
        <div className="text-center lg:text-left">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-2xl mb-6">
            <span className="text-white font-bold text-2xl">L&F</span>
          </div>
          
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Lost & Found
            <span className="text-gradient block">Find What Matters</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8">
            Connect with your community to reunite lost items with their owners. 
            Every lost item has a story worth telling.
          </p>
          
          {/* Features */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 rounded-xl mb-3">
                <Search className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Smart Search</h3>
              <p className="text-sm text-gray-600">Find items quickly with advanced filters</p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-secondary-100 rounded-xl mb-3">
                <Heart className="w-6 h-6 text-secondary-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Community</h3>
              <p className="text-sm text-gray-600">Connect with helpful neighbors</p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-accent-100 rounded-xl mb-3">
                <Shield className="w-6 h-6 text-accent-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Secure</h3>
              <p className="text-sm text-gray-600">Safe and private messaging</p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-xl mb-3">
                <Users className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Social</h3>
              <p className="text-sm text-gray-600">Share and discover together</p>
            </div>
          </div>
        </div>
        
        {/* Right side - Login form */}
        <div className="bg-white rounded-2xl shadow-strong p-8 border border-gray-100">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome Back
            </h2>
            <p className="text-gray-600">
              Sign in to continue helping your community
            </p>
          </div>
          
          <div className="space-y-6">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center space-x-3 text-lg py-4"
            >
              {loading ? (
                <div className="spinner w-5 h-5"></div>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Demo Mode</span>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Demo Access:</strong> Click "Continue with Google" to access the demo version. 
                No actual Google account required for testing.
              </p>
            </div>
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              By signing in, you agree to our{' '}
              <a href="#" className="text-primary-600 hover:text-primary-700">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-primary-600 hover:text-primary-700">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;