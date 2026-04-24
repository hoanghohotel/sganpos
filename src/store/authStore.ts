import { create } from 'zustand';
import api from '../lib/api';

interface User {
  id: string;
  name: string;
  email: string;
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
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  checkShift: () => Promise<void>;
  openShift: (openingBalance: number) => Promise<void>;
  closeShift: (closingBalance: number, activeTablesCount?: number) => Promise<any>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  shift: null,
  isLoading: true,

  login: async (email, password) => {
    try {
      const res = await api.post('/api/auth/login', { email, password });
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

  register: async (name, email, password) => {
    try {
      await api.post('/api/auth/register', { name, email, password });
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
    try {
      const res = await api.get('/api/auth/me');
      set({ user: res.data, isLoading: false });
      if (res.data) await get().checkShift();
    } catch (err: any) {
      // Only log errors that are not 401 (unauthorized)
      if (err.response?.status !== 401) {
        console.error('CheckAuth error:', err);
      }
      localStorage.removeItem('token');
      set({ user: null, isLoading: false });
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

  closeShift: async (closingBalance: number, activeTablesCount?: number) => {
    try {
      const res = await api.post('/api/shifts/close', { closingBalance, activeTablesCount });
      set({ shift: null });
      return res.data;
    } catch (err) {
      console.error('CloseShift error:', err);
      throw err;
    }
  }
}));
