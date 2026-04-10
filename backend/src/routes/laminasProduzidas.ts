import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { getCurrentShift } from '../services/shiftService';

const createSchema = z.object({
  uldNumber: z.string().min(1),
  clientName: z.string().min(1),
});

export async function laminasProduzidasRoutes(app: FastifyInstance) {
  app.post('/laminas-produzidas', { preHandler: authenticate }, async (request, reply) => {
    const body = createSchema.parse(request.body);
    const shift = getCurrentShift();

    const lamina = await app.prisma.laminaProduzida.create({
      data: {
        userId: request.userId,
        shift,
        uldNumber: body.uldNumber,
        clientName: body.clientName,
      },
      include: { user: { select: { username: true, firstName: true, lastName: true } } },
    });

    return reply.code(201).send({ success: true, lamina });
  });

  app.get('/laminas-produzidas', { preHandler: authenticate }, async (request, reply) => {
    const laminas = await app.prisma.laminaProduzida.findMany({
      where: { userId: request.userId },
      include: { user: { select: { username: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return reply.send({ success: true, data: laminas });
  });
}
