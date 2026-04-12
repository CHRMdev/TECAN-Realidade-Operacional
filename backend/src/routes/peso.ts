import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';

const createSchema = z.object({
  pesoKg: z.number().positive('Peso deve ser maior que zero'),
  shift: z.enum(['A', 'B', 'C']),
});

export async function pesoRoutes(app: FastifyInstance) {
  app.post('/atividades/peso', { preHandler: authenticate }, async (request, reply) => {
    const body = createSchema.parse(request.body);

    const peso = await app.prisma.pesoMovimentado.create({
      data: {
        userId: request.userId,
        shift: body.shift,
        pesoKg: body.pesoKg,
      },
      include: { user: { select: { username: true, firstName: true, lastName: true } } },
    });

    return reply.code(201).send({ success: true, peso });
  });

  app.get('/atividades/peso', { preHandler: authenticate }, async (request, reply) => {
    const pesos = await app.prisma.pesoMovimentado.findMany({
      where: { userId: request.userId },
      orderBy: { createdAt: 'desc' },
    });
    return reply.send({ success: true, data: pesos });
  });
}
