import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach token to every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  // If token exists, add Authorization header
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401 (token expired or invalid)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // If server returns 401, token is expired or invalid → force logout
    if (error.response && error.response.status === 401) {
      const currentPath = window.location.pathname;

      // If not already on login page, clear session and redirect
      if (currentPath !== '/login') {
        localStorage.removeItem('authToken');
        localStorage.removeItem('recruitment_auth_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;