import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { messagesAPI } from '../services/api';
import { 
  MessageCircle, 
  Send, 
  Search, 
  Clock,
  User,
  Package
} from 'lucide-react';
import { formatRelativeTime } from '../utils/helpers';
import toast from 'react-hot-toast';

const Messages = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const response = await messagesAPI.getMessages();
      setConversations(response.data.conversations);
      
      // Auto-select first conversation if available
      if (response.data.conversations.length > 0 && !selectedConversation) {
        setSelectedConversation(response.data.conversations[0]);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    setSendingMessage(true);
    try {
      await messagesAPI.sendMessage({
        receiver_id: selectedConversation.other_user_id,
        item_id: selectedConversation.item_id,
        content: newMessage
      });
      
      setNewMessage('');
      // Refresh messages
      await fetchMessages();
      
      toast.success('Message sent!');
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-96 bg-white rounded-xl shadow-soft flex items-center justify-center">
            <div className="text-center">
              <div className="spinner w-8 h-8 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading messages...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Messages</h1>
          <p className="text-gray-600">
            Communicate with other community members about lost items
          </p>
        </div>

        {conversations.length === 0 ? (
          <div className="card text-center py-12">
            <MessageCircle size={64} className="mx-auto text-gray-400 mb-6" />
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              No messages yet
            </h3>
            <p className="text-gray-600 mb-6">
              Start conversations by contacting item owners or people who might have found your items
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/find" className="btn-primary">
                Browse Lost Items
              </a>
              <a href="/report" className="btn-outline">
                Report Lost Item
              </a>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-soft overflow-hidden" style={{ height: '600px' }}>
            <div className="flex h-full">
              {/* Conversations List */}
              <div className="w-1/3 border-r border-gray-200 flex flex-col">
                <div className="p-4 border-b border-gray-200">
                  <div className="relative">
                    <Search size={20} className="absolute left-3 top-2.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search conversations..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  {conversations.map((conversation) => (
                    <button
                      key={`${conversation.item_id}_${conversation.other_user_id}`}
                      onClick={() => setSelectedConversation(conversation)}
                      className={`w-full p-4 text-left border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                        selectedConversation?.item_id === conversation.item_id &&
                        selectedConversation?.other_user_id === conversation.other_user_id
                          ? 'bg-primary-50 border-primary-200'
                          : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                          <User size={16} className="text-gray-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              User #{conversation.other_user_id.slice(-4)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatRelativeTime(conversation.last_message)}
                            </p>
                          </div>
                          <div className="flex items-center space-x-1 mb-2">
                            <Package size={12} className="text-gray-400" />
                            <p className="text-xs text-gray-600 truncate">
                              Item #{conversation.item_id.slice(-6)}
                            </p>
                          </div>
                          {conversation.messages && conversation.messages.length > 0 && (
                            <p className="text-sm text-gray-600 truncate">
                              {conversation.messages[0].content}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Area */}
              <div className="flex-1 flex flex-col">
                {selectedConversation ? (
                  <>
                    {/* Chat Header */}
                    <div className="p-4 border-b border-gray-200 bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                          <User size={14} className="text-white" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">
                            User #{selectedConversation.other_user_id.slice(-4)}
                          </h3>
                          <div className="flex items-center space-x-1">
                            <Package size={12} className="text-gray-400" />
                            <p className="text-xs text-gray-600">
                              About Item #{selectedConversation.item_id.slice(-6)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                      {selectedConversation.messages && selectedConversation.messages.length > 0 ? (
                        selectedConversation.messages
                          .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
                          .map((message, index) => (
                            <div
                              key={index}
                              className={`flex ${
                                message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                              }`}
                            >
                              <div
                                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                  message.sender_id === user?.id
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-gray-200 text-gray-900'
                                }`}
                              >
                                <p className="text-sm">{message.content}</p>
                                <p className={`text-xs mt-1 ${
                                  message.sender_id === user?.id
                                    ? 'text-primary-100'
                                    : 'text-gray-500'
                                }`}>
                                  {formatRelativeTime(message.created_at)}
                                </p>
                              </div>
                            </div>
                          ))
                      ) : (
                        <div className="text-center py-8">
                          <MessageCircle size={48} className="mx-auto text-gray-400 mb-4" />
                          <p className="text-gray-500">No messages yet</p>
                          <p className="text-sm text-gray-400">Start the conversation below</p>
                        </div>
                      )}
                    </div>

                    {/* Message Input */}
                    <div className="p-4 border-t border-gray-200">
                      <form onSubmit={handleSendMessage} className="flex space-x-3">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type your message..."
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          disabled={sendingMessage}
                        />
                        <button
                          type="submit"
                          disabled={sendingMessage || !newMessage.trim()}
                          className="px-6 py-2 bg-primary-500 text-white rounded-full hover:bg-primary-600 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                        >
                          {sendingMessage ? (
                            <div className="spinner w-4 h-4"></div>
                          ) : (
                            <Send size={16} />
                          )}
                        </button>
                      </form>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <MessageCircle size={64} className="mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Select a conversation
                      </h3>
                      <p className="text-gray-500">
                        Choose a conversation from the list to start messaging
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;