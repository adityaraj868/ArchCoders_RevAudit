import { apiRequest } from './client';
import type { AuthUser } from './auth';

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: AuthUser['role'];
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
}

// Every function here hits a HEAD_ADMIN-only backend route — the backend
// rejects with 403 for anyone else, this module doesn't duplicate that check.
export async function listUsers(): Promise<ManagedUser[]> {
  const data = await apiRequest<{ users: ManagedUser[] }>('/admin/users');
  return data.users;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'USER';
}

export async function createUser(input: CreateUserInput): Promise<ManagedUser> {
  const data = await apiRequest<{ user: ManagedUser }>('/admin/users', {
    method: 'POST',
    body: input,
  });
  return data.user;
}

export async function changeUserRole(id: string, role: 'ADMIN' | 'USER'): Promise<ManagedUser> {
  const data = await apiRequest<{ user: ManagedUser }>(`/admin/users/${id}/role`, {
    method: 'PATCH',
    body: { role },
  });
  return data.user;
}

export async function removeUser(id: string): Promise<void> {
  await apiRequest<void>(`/admin/users/${id}`, { method: 'DELETE' });
}
