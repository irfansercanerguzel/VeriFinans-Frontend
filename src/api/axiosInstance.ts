import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

const axiosInstance = axios.create({
  baseURL: 'https://verifinans-api.onrender.com', 
  headers: {
    'Content-Type': 'application/json',
  },
});

// Her isteğe otomatik Token ekleyen Interceptor
axiosInstance.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 401 (Unauthorized) hatası gelirse otomatik Logout yapan Interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token eskidiyse veya geçersizse kullanıcıyı dışarı at
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;