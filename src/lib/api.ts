import axios from 'axios';
import { getTenantId } from './tenantUtils';

const api = axios.create({
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  
  if (typeof window !== 'undefined') {
    const tenantId = getTenantId();
    if (tenantId) {
      config.headers['x-tenant-id'] = tenantId;
    }
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
