import { apiRequest, setToken, clearToken } from './client';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'viewer';
}

interface LoginResponse {
  user: AuthUser;
  token: string;
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const data = await apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
  setToken(data.token);
  return data.user;
}

export async function getCurrentUser(): Promise<AuthUser> {
  const data = await apiRequest<{ user: AuthUser }>('/auth/me');
  return data.user;
}

export function logout(): void {
  clearToken();
}
