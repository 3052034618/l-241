import { create } from 'zustand';
import type { User, LoginRequest, LoginResponse } from '../../shared/index.js';
import api from '../utils/api.js';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginRequest) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isLoading: false,
  error: null,

  login: async (credentials: LoginRequest) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post<LoginResponse>('/auth/login', credentials);
      
      if (response.success && response.data) {
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        set({ user, token, isLoading: false });
        return true;
      } else {
        set({ error: response.message || '登录失败', isLoading: false });
        return false;
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '登录失败', 
        isLoading: false 
      });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, error: null });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ user: null, token: null });
      return false;
    }

    try {
      const response = await api.get<User>('/auth/me');
      if (response.success && response.data) {
        set({ user: response.data, token });
        return true;
      } else {
        localStorage.removeItem('token');
        set({ user: null, token: null });
        return false;
      }
    } catch {
      localStorage.removeItem('token');
      set({ user: null, token: null });
      return false;
    }
  },

  clearError: () => set({ error: null }),
}));

export const roleNames: Record<string, string> = {
  donor: '捐赠人',
  project_admin: '项目管理员',
  inventory_admin: '物资管理员',
  foundation_admin: '基金会负责人',
};
