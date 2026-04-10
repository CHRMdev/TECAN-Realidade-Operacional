import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { FastifyInstance } from 'fastify';
import { JwtPayload } from '../types';

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12');
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh-secret';

export interface RegisterInput {
  firstName: string;
  lastName: string;
  password: string;
}

export interface LoginInput {
  username: string;
  password: string;
}

export function generateTokens(
  app: FastifyInstance,
  userId: string,
  username: string
): { token: string; refreshToken: string } {
  const accessPayload: JwtPayload = { userId, username, type: 'access' };
  const refreshPayload: JwtPayload = { userId, username, type: 'refresh' };

  const token = app.jwt.sign(accessPayload, { expiresIn: JWT_EXPIRES_IN });
  const refreshToken = jwt.sign(refreshPayload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN as any,
  });

  return { token, refreshToken };
}

export async function registerUser(
  prisma: PrismaClient,
  app: FastifyInstance,
  input: RegisterInput
): Promise<{
  user: { id: string; username: string; firstName: string; lastName: string };
  token: string;
  refreshToken: string;
}> {
  const username =
    input.firstName.toLowerCase() + '.' + input.lastName.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { username } });

  if (existing) {
    const error = new Error('Username já cadastrado') as any;
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

  const user = await prisma.user.create({
    data: { firstName: input.firstName, lastName: input.lastName, username, passwordHash },
    select: { id: true, username: true, firstName: true, lastName: true },
  });

  const { token, refreshToken } = generateTokens(app, user.id, user.username);
  return { user, token, refreshToken };
}

export async function loginUser(
  prisma: PrismaClient,
  app: FastifyInstance,
  input: LoginInput
): Promise<{
  user: { id: string; username: string; firstName: string; lastName: string };
  token: string;
  refreshToken: string;
}> {
  const user = await prisma.user.findUnique({ where: { username: input.username } });

  if (!user) {
    const error = new Error('Credenciais inválidas') as any;
    error.statusCode = 401;
    throw error;
  }

  const passwordMatch = await bcrypt.compare(input.password, user.passwordHash);

  if (!passwordMatch) {
    const error = new Error('Credenciais inválidas') as any;
    error.statusCode = 401;
    throw error;
  }

  const { token, refreshToken } = generateTokens(app, user.id, user.username);
  return {
    user: { id: user.id, username: user.username, firstName: user.firstName, lastName: user.lastName },
    token,
    refreshToken,
  };
}

export function refreshTokens(
  app: FastifyInstance,
  refreshToken: string
): { token: string; refreshToken: string } {
  try {
    const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as JwtPayload;

    if (payload.type !== 'refresh') {
      const error = new Error('Tipo de token inválido') as any;
      error.statusCode = 401;
      throw error;
    }

    return generateTokens(app, payload.userId, payload.username);
  } catch (err: any) {
    if (err.statusCode) throw err;
    const error = new Error('Refresh token inválido ou expirado') as any;
    error.statusCode = 401;
    throw error;
  }
}
