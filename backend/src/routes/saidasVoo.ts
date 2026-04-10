import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { getCurrentShift } from '../services/shiftService';

const createSchema = z.object({
  flightNumber: z.string().min(1),
});

export async function saidasVooRoutes(app: FastifyInstance) {
  app.post('/saidas-voo', { preHandler: authenticate }, async (request, reply) => {
    const body = createSchema.parse(request.body);
    const shift = getCurrentShift();

    const saida = await app.prisma.saidaVoo.create({
      data: {
        userId: request.userId,
        shift,
        flightNumber: body.flightNumber,
      },
      include: { user: { select: { username: true, firstName: true, lastName: true } } },
    });

    return reply.code(201).send({ success: true, saida });
  });

  app.get('/saidas-voo', { preHandler: authenticate }, async (request, reply) => {
    const saidas = await app.prisma.saidaVoo.findMany({
      where: { userId: request.userId },
      include: { user: { select: { username: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return reply.send({ success: true, data: saidas });
  });
}
