import client from './client';
import type { DashboardSummaryData } from '../types';

export async function getSummary(from: string, to: string): Promise<DashboardSummaryData> {
  const res = await client.get('/api/dashboard/summary', { params: { from, to } });
  return res.data;
}
