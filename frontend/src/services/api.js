// Get the API base URL from environment or use current host for LAN access
const getApiBaseUrl = () => {
  // In development, use the current hostname with backend port
  const hostname = window.location.hostname;
  return `http://${hostname}:8000`;
};

export const API_BASE_URL = getApiBaseUrl();
export const IMAGE_BASE_URL = `${API_BASE_URL}/images`;

// Token management
export const getToken = () => localStorage.getItem('token');
export const setToken = (token) => localStorage.setItem('token', token);
export const removeToken = () => localStorage.removeItem('token');

// User management
export const getUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};
export const setUser = (user) => localStorage.setItem('user', JSON.stringify(user));
export const removeUser = () => localStorage.removeItem('user');

// API helper
const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();
  
  const headers = {
    ...options.headers,
  };
  
  // Don't set Content-Type for FormData (browser will set it with boundary)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
    throw new Error(error.detail || 'An error occurred');
  }
  
  return response.json();
};

// Auth API
export const authApi = {
  register: (data) => apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  login: (data) => apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  getMe: () => apiRequest('/auth/me'),
  
  getUser: (userId) => apiRequest(`/auth/user/${userId}`),
};

// Food API
export const foodApi = {
  getAll: (page = 1, limit = 10) => 
    apiRequest(`/food?page=${page}&limit=${limit}`),
  
  getMyListings: (page = 1, limit = 10) => 
    apiRequest(`/food/my-listings?page=${page}&limit=${limit}`),
  
  search: (params) => {
    const queryParams = new URLSearchParams();
    if (params.keyword) queryParams.append('keyword', params.keyword);
    if (params.food_type) queryParams.append('food_type', params.food_type);
    if (params.min_price !== undefined) queryParams.append('min_price', params.min_price);
    if (params.max_price !== undefined) queryParams.append('max_price', params.max_price);
    queryParams.append('page', params.page || 1);
    queryParams.append('limit', params.limit || 10);
    return apiRequest(`/food/search?${queryParams}`);
  },
  
  getById: (id) => apiRequest(`/food/${id}`),
  
  create: (formData) => apiRequest('/food/', {
    method: 'POST',
    body: formData,
  }),
  
  update: (id, formData) => apiRequest(`/food/${id}`, {
    method: 'PUT',
    body: formData,
  }),
  
  delete: (id) => apiRequest(`/food/${id}`, {
    method: 'DELETE',
  }),
  
  uploadImage: (formData) => apiRequest('/food/upload-image', {
    method: 'POST',
    body: formData,
  }),
};

// Orders API
export const ordersApi = {
  getAll: (status, page = 1, limit = 10) => {
    let url = `/orders?page=${page}&limit=${limit}`;
    if (status) url += `&status_filter=${status}`;
    return apiRequest(url);
  },
  
  getById: (id) => apiRequest(`/orders/${id}`),
  
  create: (data) => apiRequest('/orders/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  updateStatus: (id, status) => apiRequest(`/orders/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  }),
  
  getStats: () => apiRequest('/orders/stats/summary'),
};

// Chat API
export const chatApi = {
  getConversations: () => apiRequest('/chat/conversations'),
  
  getMessages: (orderId, page = 1, limit = 50) => 
    apiRequest(`/chat/order/${orderId}?page=${page}&limit=${limit}`),
  
  sendMessage: (orderId, message) => apiRequest('/chat/', {
    method: 'POST',
    body: JSON.stringify({ order_id: orderId, message }),
  }),
  
  markAsRead: (orderId) => apiRequest(`/chat/read/${orderId}`, {
    method: 'PUT',
  }),
};

// Notifications API
export const notificationsApi = {
  getAll: (unreadOnly = false, page = 1, limit = 20) => 
    apiRequest(`/notifications?unread_only=${unreadOnly}&page=${page}&limit=${limit}`),
  
  getUnreadCount: () => apiRequest('/notifications/unread-count'),
  
  markAsRead: (id) => apiRequest(`/notifications/${id}/read`, {
    method: 'PUT',
  }),
  
  markAllAsRead: () => apiRequest('/notifications/read-all', {
    method: 'PUT',
  }),
  
  delete: (id) => apiRequest(`/notifications/${id}`, {
    method: 'DELETE',
  }),
};

const api = {
  auth: authApi,
  food: foodApi,
  orders: ordersApi,
  chat: chatApi,
  notifications: notificationsApi,
};

export default api;
