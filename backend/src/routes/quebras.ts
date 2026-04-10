import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { getCurrentShift } from '../services/shiftService';

const createSchema = z.object({
  flightNumber: z.string().min(1),
  uldNumber: z.string().min(1),
});

export async function quebrasRoutes(app: FastifyInstance) {
  app.post('/quebras', { preHandler: authenticate }, async (request, reply) => {
    const body = createSchema.parse(request.body);
    const shift = getCurrentShift();

    const quebra = await app.prisma.quebra.create({
      data: {
        userId: request.userId,
        shift,
        flightNumber: body.flightNumber,
        uldNumber: body.uldNumber,
      },
      include: { user: { select: { username: true, firstName: true, lastName: true } } },
    });

    return reply.code(201).send({ success: true, quebra });
  });

  app.get('/quebras', { preHandler: authenticate }, async (request, reply) => {
    const quebras = await app.prisma.quebra.findMany({
      where: { userId: request.userId },
      include: { user: { select: { username: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return reply.send({ success: true, data: quebras });
  });
}
