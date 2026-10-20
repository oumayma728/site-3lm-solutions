import { API_URL } from '@/lib/apiUrl';
import axios from 'axios';
import { getToken, clearToken } from './auth';

const api = axios.create({
  // Same variable as the rest of the site: set NEXT_PUBLIC_API_URL in production (e.g. https://api.<domain>/api)
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as Record<string, string>).Authorization = `Token ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401 && typeof window !== 'undefined') {
      clearToken();
      window.location.href = `/public/login?next=${encodeURIComponent(window.location.pathname)}`;
    }
    return Promise.reject(err);
  }
);

export default api;