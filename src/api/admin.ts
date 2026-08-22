import { apiRequest } from './client';

export interface AdminDashboard {
  admin: { id: string; name: string };
  presentations: { total: number; published: number; draft: number };
}

export async function getDashboard(): Promise<AdminDashboard> {
  return apiRequest<AdminDashboard>('/admin/dashboard');
}
