import client from './client';
import type { Quebra, Entrega, LaminaProduzida, SaidaVoo } from '../types';

export async function postQuebra(data: {
  flightNumber: string;
  uldNumber: string;
}): Promise<{ success: true; quebra: Quebra }> {
  const res = await client.post('/api/quebras', data);
  return res.data;
}

export async function postEntrega(data: {
  deliveryType: 'VOLUME' | 'LAMINA';
  uldNumber?: string;
  awbs: string[];
}): Promise<{ success: true; entrega: Entrega }> {
  const res = await client.post('/api/entregas', data);
  return res.data;
}

export async function postLamina(data: {
  uldNumber: string;
  clientName: string;
}): Promise<{ success: true; lamina: LaminaProduzida }> {
  const res = await client.post('/api/laminas-produzidas', data);
  return res.data;
}

export async function postSaidaVoo(data: {
  flightNumber: string;
}): Promise<{ success: true; saida: SaidaVoo }> {
  const res = await client.post('/api/saidas-voo', data);
  return res.data;
}
