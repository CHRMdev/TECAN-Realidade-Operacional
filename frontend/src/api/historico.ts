import client from './client';
import type { HistoricoResponse } from '../types';

export async function getHistorico(params: {
  page?: number;
  limit?: number;
  type?: string;
  from?: string;
  to?: string;
}): Promise<HistoricoResponse> {
  const res = await client.get('/api/historico', { params });
  return res.data;
}
