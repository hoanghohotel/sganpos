import { create } from 'zustand';
import api from '../lib/api';

interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: 'ADMIN' | 'STAFF';
}

interface Shift {
  _id: string;
  userName: string;
  startTime: string;
  openingBalance: number;
  status: 'OPEN' | 'CLOSED';
  code: string;
}

interface AuthState {
  user: User | null;
  shift: Shift | null;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (name: string, identifier: { email?: string; phone?: string }, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  checkShift: () => Promise<void>;
  openShift: (openingBalance: number) => Promise<void>;
  closeShift: (closingBalance: number, notes?: string, activeTablesCount?: number) => Promise<any>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  shift: null,
  isLoading: true,

  login: async (identifier, password) => {
    try {
      const res = await api.post('/api/auth/login', { identifier, password });
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
      }
      set({ user: res.data.user });
      await get().checkShift();
    } catch (err) {
      console.error('Login error:', err);
      throw err;
    }
  },

  register: async (name, identifier, password) => {
    try {
      await api.post('/api/auth/register', { 
        name, 
        email: identifier.email, 
        phone: identifier.phone, 
        password 
      });
    } catch (err) {
      console.error('Register error:', err);
      throw err;
    }
  },

  logout: async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('token');
      set({ user: null, shift: null });
    }
  },

  checkAuth: async () => {
    // If we're already loading, don't start another check
    const { user, isLoading } = get();
    console.log(`[AuthStore] checkAuth started. Current state: user=${!!user}, isLoading=${isLoading}`);
    
    try {
      const res = await api.get('/api/auth/me');
      console.log('[AuthStore] checkAuth success:', res.data?.name || 'Unknown User');
      set({ user: res.data, isLoading: false });
      if (res.data) await get().checkShift();
    } catch (err: any) {
      const status = err.response?.status;
      console.warn(`[AuthStore] checkAuth failed with status ${status}:`, err.message);
      
      // ONLY clear session on explicit 401/403/400 (Client errors)
      // Do NOT clear on 500+ (Server errors, Database unstable, etc.)
      if (status === 401 || status === 403 || status === 400 || (err.message && err.message.includes('Network Error'))) {
        console.log('[AuthStore] Clearing session due to auth error');
        localStorage.removeItem('token');
        set({ user: null, isLoading: false });
      } else {
        console.log('[AuthStore] Keeping session, might be temporary server error');
        set({ isLoading: false });
      }
    }
  },

  checkShift: async () => {
    try {
      const res = await api.get('/api/shifts/current');
      set({ shift: res.data });
    } catch (err) {
      console.error('CheckShift error:', err);
      set({ shift: null });
    }
  },

  openShift: async (openingBalance) => {
    try {
      const res = await api.post('/api/shifts/open', { openingBalance });
      set({ shift: res.data });
    } catch (err) {
      console.error('OpenShift error:', err);
      throw err;
    }
  },

  closeShift: async (closingBalance: number, notes?: string, activeTablesCount?: number) => {
    try {
      const res = await api.post('/api/shifts/close', { closingBalance, notes, activeTablesCount });
      set({ shift: null });
      return res.data;
    } catch (err) {
      console.error('CloseShift error:', err);
      throw err;
    }
  }
}));
