import client from './client';

export interface AdminUser {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  role: 'operator' | 'admin';
  createdAt: string;
}

export interface AdminRecord {
  type: 'quebra' | 'entrega' | 'lamina' | 'saida_voo' | 'peso';
  createdAt: string;
  data: Record<string, unknown>;
}

export interface AdminRecordsResponse {
  success: boolean;
  data: AdminRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function getAdminUsers(): Promise<{ success: boolean; data: AdminUser[] }> {
  const res = await client.get('/api/admin/users');
  return res.data;
}

export async function changeUserRole(userId: string, role: 'operator' | 'admin'): Promise<void> {
  await client.patch(`/api/admin/users/${userId}/role`, { role });
}

export async function resetUserPassword(userId: string, newPassword: string): Promise<void> {
  await client.post(`/api/admin/users/${userId}/reset-password`, { newPassword });
}

export async function getAdminRecords(params: {
  page?: number;
  limit?: number;
  type?: string;
  userId?: string;
  from?: string;
  to?: string;
}): Promise<AdminRecordsResponse> {
  const res = await client.get('/api/admin/records', { params });
  return res.data;
}

export async function deleteRecord(type: string, id: string): Promise<void> {
  await client.delete(`/api/admin/records/${type}/${id}`);
}

export async function bulkDeleteRecords(records: Array<{ type: string; id: string }>): Promise<void> {
  await client.delete('/api/admin/records/bulk', { data: { records } });
}
