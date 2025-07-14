const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : 'https://eco-trade-mern2.onrender.com/api');

// Auth token management
let authToken: string | null = localStorage.getItem('ecotrade_token');

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    localStorage.setItem('ecotrade_token', token);
  } else {
    localStorage.removeItem('ecotrade_token');
  }
};

// API request helper
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  // Always get the latest token from localStorage
  authToken = localStorage.getItem('ecotrade_token');
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(authToken && { Authorization: `Bearer ${authToken}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return data;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
};

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setAuthToken(data.token);
    return data;
  },

  register: async (name: string, email: string, password: string, location?: string) => {
    const data = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, location }),
    });
    setAuthToken(data.token);
    return data;
  },

  getCurrentUser: async () => {
    return apiRequest('/auth/me');
  },

  updateProfile: async (profileData: any) => {
    return apiRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  logout: () => {
    setAuthToken(null);
  },

  forgotPassword: async (email: string) => {
    return apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },
  resetPassword: async (email: string, code: string, newPassword: string) => {
    return apiRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, code, newPassword }),
    });
  },
};

// Items API
export const itemsAPI = {
  getItems: async (params: any = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/items?${queryString}`);
  },

  getItem: async (id: string) => {
    return apiRequest(`/items/${id}`);
  },

  createItem: async (itemData: FormData) => {
    // Use fetch directly for FormData (do not set Content-Type)
    const url = `${API_BASE_URL}/items`;
    authToken = localStorage.getItem('ecotrade_token');
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...(authToken && { Authorization: `Bearer ${authToken}` })
        // Do not set 'Content-Type' when sending FormData
      },
      body: itemData,
      credentials: 'include',
    });
    let data;
    try {
      data = await response.json();
    } catch (e) {
      throw new Error('Invalid server response');
    }
    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }
    return data;
  },

  updateItem: async (id: string, itemData: FormData) => {
    return apiRequest(`/items/${id}`, {
      method: 'PUT',
      headers: {
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
      },
      body: itemData,
    });
  },

  deleteItem: async (id: string) => {
    return apiRequest(`/items/${id}`, {
      method: 'DELETE',
    });
  },

  toggleFavorite: async (id: string) => {
    return apiRequest(`/items/${id}/favorite`, {
      method: 'POST',
    });
  },

  getUserItems: async (userId: string, params: any = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/items/user/${userId}?${queryString}`);
  },

  rateTrade: async (itemId: string, rating: number, review?: string) => {
    return apiRequest(`/items/${itemId}/rate`, {
      method: 'POST',
      body: JSON.stringify({ rating, review }),
    });
  },
};



// Chat API
export const chatAPI = {
  getChats: async () => {
    return apiRequest('/chat');
  },

  getMessages: async (chatId: string, params: any = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/chat/${chatId}/messages?${queryString}`);
  },

  sendMessage: async (chatId: string, content: string, messageType: string = 'text') => {
    return apiRequest(`/chat/${chatId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content, messageType }),
    });
  },

  createChat: async (participantId: string) => {
    return apiRequest('/chat/create', {
      method: 'POST',
      body: JSON.stringify({ participantId }),
    });
  },

  markAsRead: async (chatId: string) => {
    return apiRequest(`/chat/${chatId}/read`, {
      method: 'PATCH',
    });
  },

  getOnlineUsers: async () => {
    return apiRequest('/chat/online-users');
  },
};

// Users API
export const usersAPI = {
  getUser: async (id: string) => {
    return apiRequest(`/users/${id}`);
  },

  getUsers: async (params: any = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/users?${queryString}`);
  },

  updateUserStatus: async (id: string, isActive: boolean) => {
    return apiRequest(`/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    });
  },

  getStats: async () => {
    return apiRequest('/users/stats/overview');
  },
};

export const tradeAPI = {
  createRequest: async (itemId: string, message?: string) => {
    return apiRequest(`/items/${itemId}/request`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  },
  updateRequestStatus: async (requestId: string, status: 'accepted' | 'declined') => {
    return apiRequest(`/items/trade-requests/${requestId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
  completeTrade: async (requestId: string) => {
    return apiRequest(`/items/trade-requests/${requestId}/complete`, {
      method: 'PATCH' });
  },
  rateTrade: async (requestId: string, rating: number, review?: string) => {
    return apiRequest(`/items/trade-requests/${requestId}/rate`, {
      method: 'POST',
      body: JSON.stringify({ rating, review }),
    });
  },
};

export default {
  auth: authAPI,
  items: itemsAPI,
  chat: chatAPI,
  users: usersAPI,
};