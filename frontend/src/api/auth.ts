import client from './client';
import type { User } from '../types';

interface AuthResponse {
  success: boolean;
  user: User;
  token: string;
  refreshToken: string;
}

export async function login(username: string, password: string): Promise<AuthResponse> {
  const res = await client.post('/auth/login', { username, password });
  return res.data;
}

export async function register(
  firstName: string,
  lastName: string,
  password: string
): Promise<AuthResponse> {
  const res = await client.post('/auth/register', { firstName, lastName, password });
  return res.data;
}

export async function getMe(): Promise<{ user: User }> {
  const res = await client.get('/auth/me');
  return res.data;
}
