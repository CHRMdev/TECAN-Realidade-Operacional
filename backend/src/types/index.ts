import { PrismaClient } from '@prisma/client';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
  interface FastifyRequest {
    userId: string;
  }
}

export interface JwtPayload {
  userId: string;
  username: string;
  type: 'access' | 'refresh';
}
