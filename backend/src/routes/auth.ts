import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { registerUser, loginUser, refreshTokens } from '../services/authService';

const registerSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  password: z.string().min(6),
});

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export async function authRoutes(app: FastifyInstance) {
  app.post('/register', async (request, reply) => {
    const body = registerSchema.parse(request.body);
    const result = await registerUser(app.prisma, app, body);
    return reply.code(201).send({ success: true, ...result });
  });

  app.post('/login', async (request, reply) => {
    const body = loginSchema.parse(request.body);
    const result = await loginUser(app.prisma, app, body);
    return reply.code(200).send({ success: true, ...result });
  });

  app.post('/refresh', async (request, reply) => {
    const { refreshToken } = refreshSchema.parse(request.body);
    const tokens = refreshTokens(app, refreshToken);
    return reply.code(200).send(tokens);
  });
}
