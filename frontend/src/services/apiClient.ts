import axios from 'axios';

// Base URL comes from environment config so it can change between
// local development, staging and production without touching code.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically attaches the stored JWT (if any) to every outgoing request.
// This is the ONLY place that reads the token for API calls — individual
// services never need to know about auth headers.
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If the backend ever responds 401 (expired/invalid token), clear the
// stale session so the app doesn't keep showing a "logged in" UI that
// can no longer actually call protected endpoints.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
    }
    return Promise.reject(error);
  }
);

export default apiClient;

