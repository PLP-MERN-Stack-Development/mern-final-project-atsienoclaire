import axios from 'axios';

// Use environment variable for API URL with fallbacks
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Log the API URL for debugging (remove in production if needed)
console.log('🔗 API Base URL:', API_URL);

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log request for debugging
    console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`, config.data || '');
    
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    // Log successful responses for debugging
    console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} - Status: ${response.status}`);
    return response;
  },
  (error) => {
    // Enhanced error handling
    console.error('❌ API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message,
      response: error.response?.data
    });

    // Handle different error types
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          delete api.defaults.headers.common['Authorization'];
          
          // Only redirect if not already on login page
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
          break;
          
        case 403:
          // Forbidden - show access denied message
          console.error('Access denied: You do not have permission for this action');
          break;
          
        case 404:
          // Not found
          console.error('Resource not found:', error.config.url);
          break;
          
        case 500:
          // Server error
          console.error('Server error occurred. Please try again later.');
          break;
          
        default:
          // Other server errors
          console.error(`Server error (${status}):`, data?.message || 'Unknown error');
      }
      
    } else if (error.request) {
      // Request was made but no response received
      console.error('Network error: No response from server. Please check your connection.');
      
    } else {
      // Something else happened
      console.error('Request setup error:', error.message);
    }

    return Promise.reject(error);
  }
);

// Helper function to check if user is authenticated
export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  return !!token;
};

// Helper function to get current user from localStorage
export const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

// Helper function to set authentication
export const setAuth = (token, user) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

// Helper function to clear authentication
export const clearAuth = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  delete api.defaults.headers.common['Authorization'];
};

// Helper function for file uploads
export const uploadFile = async (file, endpoint, onProgress = null) => {
  const formData = new FormData();
  formData.append('file', file);

  const config = {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(percentCompleted);
      }
    },
  };

  return api.post(endpoint, formData, config);
};

// Helper function for handling API errors in components
export const handleApiError = (error, setError = null) => {
  let errorMessage = 'An unexpected error occurred';

  if (error.response?.data?.message) {
    errorMessage = error.response.data.message;
  } else if (error.response?.data?.errors) {
    errorMessage = error.response.data.errors.join(', ');
  } else if (error.message) {
    errorMessage = error.message;
  }

  console.error('API Error:', errorMessage);

  if (setError) {
    setError(errorMessage);
  }

  return errorMessage;
};

// Helper function for retry mechanism
export const apiWithRetry = async (apiCall, maxRetries = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
      console.log(`🔄 Retrying API call (attempt ${attempt + 1})...`);
    }
  }
};

export default api;