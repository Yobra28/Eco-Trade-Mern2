import React, { useState, useEffect, useRef } from 'react';
import { Search, Send, Paperclip, MoreVertical, Phone, Video } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SocketService from '../services/socket';
import { chatAPI } from '../services/api';
import { toast } from 'react-toastify';

const ChatPage = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const socketRef = useRef<any>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const selectedChatRef = useRef(selectedChat);
  const [search, setSearch] = useState('');

  // Helper to refresh chat list
  const refreshChats = () => {
    setLoadingChats(true);
    chatAPI.getChats()
      .then((data: any) => setChats(data.chats || data))
      .catch(() => setChats([]))
      .finally(() => setLoadingChats(false));
  };

  // Fetch chat list
  useEffect(() => {
    if (!user) return;
    refreshChats();
  }, [user]);

  // Fetch online users
  useEffect(() => {
    if (!user) return;
    const fetchOnlineUsers = async () => {
      try {
        const data = await chatAPI.getOnlineUsers();
        setOnlineUsers(new Set(data.onlineUsers || []));
      } catch (error) {
        console.error('Failed to fetch online users:', error);
      }
    };
    fetchOnlineUsers();
  }, [user]);

  // Connect to socket on mount
  useEffect(() => {
    if (!user) return;
    // Get token from localStorage
    const token = localStorage.getItem('ecotrade_token');
    if (!token) return;
    const socket = SocketService.connect(token);
    socketRef.current = socket;
    return () => {
      SocketService.disconnect();
    };
  }, [user]);

  // Listen for real-time new message notifications and refresh chat list
  useEffect(() => {
    if (!user) return;
    const socket = SocketService.getSocket && SocketService.getSocket();
    if (!socket) return;
    const handleNewMessage = (data: any) => {
      refreshChats();
      // Only show toast if the new message is NOT in the currently open chat
      if (!selectedChat || data.chatId !== selectedChat) {
        toast.info(`New message from ${data.senderName || 'someone'}`);
      }
    };
    socket.on && socket.on('notification:new_message', handleNewMessage);
    return () => {
      socket.off && socket.off('notification:new_message', handleNewMessage);
    };
  }, [user, selectedChat]);

  // Listen for typing events
  useEffect(() => {
    if (!user) return;
    const socket = SocketService.getSocket && SocketService.getSocket();
    if (!socket) return;

    const handleTypingStart = (data: { chatId: string; userId: string; userName: string }) => {
      if (data.chatId === selectedChat && data.userId !== user.id) {
        setTypingUsers(prev => new Set(prev).add(data.userId));
      }
    };

    const handleTypingStop = (data: { chatId: string; userId: string }) => {
      if (data.chatId === selectedChat) {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.userId);
          return newSet;
        });
      }
    };

    SocketService.onTypingStart(handleTypingStart);
    SocketService.onTypingStop(handleTypingStop);

    return () => {
      SocketService.offTypingStart();
      SocketService.offTypingStop();
    };
  }, [user, selectedChat]);

  // Listen for online status events and refetch online users immediately
  useEffect(() => {
    if (!user) return;
    const socket = SocketService.getSocket && SocketService.getSocket();
    if (!socket) return;

    const fetchOnlineUsers = async () => {
      try {
        const data = await chatAPI.getOnlineUsers();
        setOnlineUsers(new Set(data.onlineUsers || []));
      } catch (error) {
        // Ignore
      }
    };

    const handleUserOnline = (data: { userId: string; userName: string }) => {
      setOnlineUsers(prev => new Set(prev).add(data.userId));
      fetchOnlineUsers(); // Refetch for accuracy
    };

    const handleUserOffline = (data: { userId: string; userName: string }) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.userId);
        return newSet;
      });
      fetchOnlineUsers(); // Refetch for accuracy
    };

    SocketService.onUserOnline(handleUserOnline);
    SocketService.onUserOffline(handleUserOffline);

    return () => {
      SocketService.offUserOnline();
      SocketService.offUserOffline();
    };
  }, [user]);

  // Add this effect to keep selectedChatRef in sync
  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  // Update the socket message handler to deduplicate messages and remove optimistic ones
  useEffect(() => {
    const handleSocketMessage = (msg: any) => {
      if (msg.chatId === selectedChatRef.current) {
        setMessages(prev => {
          // Remove any optimistic message with same content and sender (pending: true)
          let filtered = prev.filter(m => {
            if (m.pending && m.content === msg.content && m.sender?.id === msg.sender?.id) {
              return false;
            }
            // Also deduplicate by _id if available
            if (m._id && msg._id && m._id === msg._id) {
              return false;
            }
            // Or by timestamp+content
            if (m.timestamp === msg.timestamp && m.content === msg.content) {
              return false;
            }
            return true;
          });
          return [...filtered, msg];
        });
      }
    };
    SocketService.onMessage(handleSocketMessage);
    return () => {
      SocketService.offMessage(); // Remove all listeners for 'receive_message'
    };
  }, []);

  // Fetch messages when chat is selected
  useEffect(() => {
    if (!selectedChat) return;
    setLoadingMessages(true);
    chatAPI.getMessages(selectedChat)
      .then((data: any) => setMessages(data.messages || data))
      .catch(() => setMessages([]))
      .finally(() => setLoadingMessages(false));
    // Join chat room
    SocketService.joinChat(selectedChat);
  }, [selectedChat]);

  // Handle typing events
  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    
    if (!selectedChat) return;

    // Emit typing start
    SocketService.startTyping(selectedChat);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      SocketService.stopTyping(selectedChat);
    }, 2000);
  };

  // Update handleSendMessage to remove optimistic UI update
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !selectedChat) return;

    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    SocketService.stopTyping(selectedChat);

    setSending(true);
    const tempId = 'temp-' + Date.now();
    const optimisticMsg = {
      _id: tempId,
      chatId: selectedChat,
      content: message,
      sender: user, // or user.id
      timestamp: new Date().toISOString(),
      pending: true,
    };
    setMessages(prev => [...prev, optimisticMsg]);
    try {
      // Send to backend (for persistence)
      await chatAPI.sendMessage(selectedChat, message);
      // Send via socket (for real-time)
      SocketService.sendMessage(selectedChat, message);
      setMessage('');
      refreshChats(); // Refresh chat list after sending
      // Do NOT update setMessages here; rely on socket event only
    } catch (err) {
      // Optionally show error
    } finally {
      setSending(false);
    }
  };

  const selectedChatData = chats.find(chat => chat.id === selectedChat || chat._id === selectedChat);
  const otherParticipant = selectedChatData?.participants?.find((p: any) => p.id !== user?.id && p._id !== user?.id);
  const isOtherUserOnline = otherParticipant && onlineUsers.has(otherParticipant.id || otherParticipant._id);
  const isOtherUserTyping = otherParticipant && typingUsers.has(otherParticipant.id || otherParticipant._id);

  const filteredChats = chats.filter(chat => {
    const other = chat.participants?.find((p: any) => p.id !== user?.id && p._id !== user?.id) || {};
    return other.name?.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
          <div className="flex h-full">
            {/* Chat List Sidebar */}
            <div className="w-80 border-r border-gray-200 flex flex-col">
              {/* Header */}
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Messages</h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
              {/* Chat List */}
              <div className="flex-1 overflow-y-auto">
                {loadingChats ? (
                  <div className="p-4 text-gray-500">Loading chats...</div>
                ) : filteredChats.length === 0 ? (
                  <div className="p-4 text-gray-500">No chats found.</div>
                ) : (
                  filteredChats.map(chat => {
                    const other = chat.participants?.find((p: any) => p.id !== user?.id && p._id !== user?.id) || {};
                    const isOnline = onlineUsers.has(other.id || other._id);
                    return (
                      <div
                        key={chat.id || chat._id}
                        onClick={() => setSelectedChat(chat.id || chat._id)}
                        className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${selectedChat === (chat.id || chat._id) ? 'bg-green-50 border-green-200' : ''}`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <img
                              src={other.avatar || 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1'}
                              alt={other.name || 'User'}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                            {/* Online indicator */}
                            {isOnline && (
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="text-sm font-medium text-gray-900 truncate">{other.name || 'User'}</h3>
                              <span className="text-xs text-gray-500">{chat.lastMessage?.timestamp ? new Date(chat.lastMessage.timestamp).toLocaleTimeString() : ''}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-gray-500 truncate">{chat.lastMessage?.content || ''}</p>
                              {isOnline && (
                                <span className="text-xs text-green-600">Online</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              {selectedChatData ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <img
                          src={otherParticipant?.avatar || 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1'}
                          alt={otherParticipant?.name || 'User'}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        {/* Online indicator */}
                        {isOtherUserOnline && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{otherParticipant?.name || 'User'}</h3>
                        <div className="flex items-center space-x-2">
                          {isOtherUserOnline && (
                            <span className="text-xs text-green-600">Online</span>
                          )}
                          {isOtherUserTyping && (
                            <span className="text-xs text-gray-500 italic">typing...</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                        <Phone className="h-5 w-5" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                        <Video className="h-5 w-5" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                        <MoreVertical className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {loadingMessages ? (
                      <div className="text-gray-500">Loading messages...</div>
                    ) : messages.length === 0 ? (
                      <div className="text-gray-500">No messages yet.</div>
                    ) : (
                      messages.map((msg: any) => (
                        <div
                          key={msg._id || msg.id}
                          className={`flex ${msg.sender?._id === user?.id || msg.sender === user?.id ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              (msg.sender?._id === user?.id || msg.sender === user?.id)
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            <p className="text-sm">{msg.content}</p>
                            <p className={`text-xs mt-1 ${
                              (msg.sender?._id === user?.id || msg.sender === user?.id)
                                ? 'text-green-100'
                                : 'text-gray-500'
                            }`}>
                              {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : ''}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                    {/* Typing indicator */}
                    {isOtherUserTyping && (
                      <div className="flex justify-start">
                        <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Message Input */}
                  <div className="p-4 border-t border-gray-200">
                    <form onSubmit={handleSendMessage} className="flex space-x-2">
                      <input
                        type="text"
                        value={message}
                        onChange={handleTyping}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        disabled={sending}
                      />
                      <button
                        type="submit"
                        disabled={sending || !message.trim()}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send className="h-5 w-5" />
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select a chat</h3>
                    <p className="text-gray-500">Choose a conversation to start messaging</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;