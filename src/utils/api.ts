import type { ApiResponse } from '../../shared/index.js';

const BASE_URL = '/api';

const getToken = (): string | null => {
  return localStorage.getItem('token');
};

const request = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        message: data.message || `请求失败: ${response.status}`,
      };
    }

    return data as ApiResponse<T>;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : '网络错误',
    };
  }
};

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),
  post: <T>(endpoint: string, body?: any) =>
    request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),
  put: <T>(endpoint: string, body?: any) =>
    request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),
};

export default api;
