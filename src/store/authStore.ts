import { create } from 'zustand';
import axios from 'axios';

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
    const res = await axios.post('/api/auth/login', { email, password });
    set({ user: res.data.user });
    await get().checkShift();
  },

  register: async (name, email, password) => {
    await axios.post('/api/auth/register', { name, email, password });
  },

  logout: async () => {
    await axios.post('/api/auth/logout');
    set({ user: null, shift: null });
  },

  checkAuth: async () => {
    try {
      const res = await axios.get('/api/auth/me');
      set({ user: res.data, isLoading: false });
      if (res.data) await get().checkShift();
    } catch (err) {
      set({ user: null, isLoading: false });
    }
  },

  checkShift: async () => {
    try {
      const res = await axios.get('/api/shifts/current');
      set({ shift: res.data });
    } catch (err) {
      set({ shift: null });
    }
  },

  openShift: async (openingBalance) => {
    const res = await axios.post('/api/shifts/open', { openingBalance });
    set({ shift: res.data });
  },

  closeShift: async (closingBalance: number, activeTablesCount?: number) => {
    const res = await axios.post('/api/shifts/close', { closingBalance, activeTablesCount });
    set({ shift: null });
    return res.data;
  }
}));
