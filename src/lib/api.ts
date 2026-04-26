import axios from 'axios';
import { getTenantIdFromPath } from './tenantUtils';

const api = axios.create({
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Extract tenant from path: domain.com/TenantId/...
  if (typeof window !== 'undefined') {
    const tenantId = getTenantIdFromPath(window.location.pathname);
    if (tenantId) {
      config.headers['x-tenant-id'] = tenantId;
    } else {
      // Fallback: search for subdomain if not found in path
      const host = window.location.hostname;
      const hostParts = host.split('.');
      if (hostParts.length >= 3 && !host.includes('localhost') && !host.includes('0.0.0.0')) {
        const sub = hostParts[0];
        if (!sub.startsWith('ais-dev-') && !sub.startsWith('ais-pre-') && sub !== 'www') {
          config.headers['x-tenant-id'] = sub;
        }
      }
    }
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
