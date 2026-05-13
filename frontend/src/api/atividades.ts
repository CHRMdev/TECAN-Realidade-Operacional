import client from './client';
import type { Quebra, Entrega, LaminaProduzida, SaidaVoo, PesoMovimentado, Contingente } from '../types';

export async function postQuebra(data: {
  flightNumber: string;
  uldNumber: string;
  shift: 'A' | 'B' | 'C';
}): Promise<{ success: true; quebra: Quebra }> {
  const res = await client.post('/api/quebras', data);
  return res.data;
}

export async function postEntrega(data: {
  deliveryType: 'VOLUME' | 'LAMINA';
  uldNumber?: string;
  awbs: string[];
  shift: 'A' | 'B' | 'C';
}): Promise<{ success: true; entrega: Entrega }> {
  const res = await client.post('/api/entregas', data);
  return res.data;
}

export async function postLamina(data: {
  uldNumber: string;
  clientName: string;
  shift: 'A' | 'B' | 'C';
}): Promise<{ success: true; lamina: LaminaProduzida }> {
  const res = await client.post('/api/laminas-produzidas', data);
  return res.data;
}

export async function postSaidaVoo(data: {
  flightNumber: string;
  shift: 'A' | 'B' | 'C';
  pesoKg?: number;
}): Promise<{ success: true; saida: SaidaVoo }> {
  const res = await client.post('/api/saidas-voo', data);
  return res.data;
}

export async function postPeso(data: {
  pesoKg: number;
  shift: 'A' | 'B' | 'C';
}): Promise<{ success: true; peso: PesoMovimentado }> {
  const res = await client.post('/api/atividades/peso', data);
  return res.data;
}

export async function postContingente(data: {
  shift: 'A' | 'B' | 'C';
  quantidadeTripulantes: number;
  dia?: string;
}): Promise<{ success: true; contingente: Contingente }> {
  const res = await client.post('/api/contingente', data);
  return res.data;
}
