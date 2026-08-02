import axios, { type InternalAxiosRequestConfig } from 'axios';
import { clearSession, setSession, store, type AuthUser } from './store';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
export const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';

export const api = axios.create({ baseURL: API_URL, withCredentials: true });

export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type TaskPriority = 'low' | 'medium' | 'high';

export type Task = {
  _id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: string;
  scheduledFor?: string | null;
  lastError?: string | null;
  attempts: number;
  attachment?: { filename: string; path: string; mimeType?: string; size?: number };
};

export type Pagination = { page: number; limit: number; total: number; pages: number };
export type TaskListResponse = { items: Task[]; pagination: Pagination };
export type Summary = {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  pendingTasks: number;
  processingTasks: number;
  queue: Record<string, number>;
};

export type TaskFilters = {
  page: number;
  limit: number;
  search: string;
  status: TaskStatus | '';
  priority: TaskPriority | '';
  sort: 'newest' | 'oldest' | 'priority';
};

export const fetchSummary = () => api.get<{ data: Summary }>('/dashboard/summary').then((r) => r.data.data);

export const fetchTasks = (filters: TaskFilters) => {
  const params = new URLSearchParams();
  params.set('page', String(filters.page));
  params.set('limit', String(filters.limit));
  params.set('sort', filters.sort);
  if (filters.search) params.set('search', filters.search);
  if (filters.status) params.set('status', filters.status);
  if (filters.priority) params.set('priority', filters.priority);
  return api.get<{ data: TaskListResponse }>(`/tasks?${params.toString()}`).then((r) => r.data.data);
};

export const createTask = (formData: FormData) => api.post<{ data: Task }>('/tasks', formData).then((r) => r.data.data);
export const updateTask = (id: string, patch: Partial<Pick<Task, 'title' | 'description' | 'priority'>>) =>
  api.patch<{ data: Task }>(`/tasks/${id}`, patch).then((r) => r.data.data);
export const retryTask = (id: string) => api.post<{ data: Task }>(`/tasks/${id}/retry`).then((r) => r.data.data);
export const deleteTask = (id: string) => api.delete(`/tasks/${id}`);

type AuthResponse = { user: AuthUser; accessToken: string };

const applyAuthHeader = (token: string | null) => {
  if (token) api.defaults.headers.common.Authorization = `Bearer ${token}`;
  else delete api.defaults.headers.common.Authorization;
};

export const login = (email: string, password: string) =>
  api.post<{ data: AuthResponse }>('/auth/login', { email, password }).then((r) => r.data.data);
export const register = (name: string, email: string, password: string) =>
  api.post<{ data: AuthResponse }>('/auth/register', { name, email, password }).then((r) => r.data.data);
export const logout = () => api.post('/auth/logout').catch(() => undefined);

/** Attempts a silent session refresh using the httpOnly refresh cookie. */
export const refreshSession = () => api.post<{ data: AuthResponse }>('/auth/refresh').then((r) => r.data.data);

/**
 * On app boot, try to restore a session from the refresh cookie so a page reload
 * doesn't force the user to sign in again.
 */
export async function bootstrapSession() {
  try {
    const data = await refreshSession();
    applyAuthHeader(data.accessToken);
    store.dispatch(setSession(data));
  } catch {
    store.dispatch(clearSession());
  }
}

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };
let refreshInFlight: Promise<AuthResponse> | null = null;

// Keep the axios Authorization header in sync with whatever the store holds.
store.subscribe(() => applyAuthHeader(store.getState().auth.accessToken));

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config as RetriableConfig | undefined;
    const status = error.response?.status;
    const isAuthEndpoint = config?.url?.includes('/auth/login') || config?.url?.includes('/auth/register') || config?.url?.includes('/auth/refresh');
    if (status === 401 && config && !config._retried && !isAuthEndpoint) {
      config._retried = true;
      try {
        refreshInFlight ||= refreshSession().finally(() => {
          refreshInFlight = null;
        });
        const data = await refreshInFlight;
        applyAuthHeader(data.accessToken);
        store.dispatch(setSession(data));
        config.headers.Authorization = `Bearer ${data.accessToken}`;
        return api.request(config);
      } catch (refreshError) {
        store.dispatch(clearSession());
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);
