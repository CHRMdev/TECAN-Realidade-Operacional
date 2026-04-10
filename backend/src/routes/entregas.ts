import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { getCurrentShift } from '../services/shiftService';

const createEntregaSchema = z
  .object({
    deliveryType: z.enum(['VOLUME', 'LAMINA']),
    uldNumber: z.string().optional(),
    awbs: z.array(z.string().min(1)).min(1),
  })
  .refine(
    (data) => data.deliveryType !== 'LAMINA' || !!data.uldNumber,
    { message: 'uldNumber obrigatorio para entrega do tipo LAMINA', path: ['uldNumber'] }
  );

export async function entregasRoutes(app: FastifyInstance) {
  app.post('/entregas', { preHandler: authenticate }, async (request, reply) => {
    const body = createEntregaSchema.parse(request.body);
    const shift = getCurrentShift();

    const entrega = await app.prisma.entrega.create({
      data: {
        userId: request.userId,
        shift,
        deliveryType: body.deliveryType,
        uldNumber: body.uldNumber,
        awbs: {
          create: body.awbs.map((awbNumber) => ({ awbNumber })),
        },
      },
      include: { awbs: true, user: { select: { username: true, firstName: true, lastName: true } } },
    });

    return reply.code(201).send({ success: true, entrega });
  });

  app.get('/entregas', { preHandler: authenticate }, async (request, reply) => {
    const entregas = await app.prisma.entrega.findMany({
      where: { userId: request.userId },
      include: { awbs: true, user: { select: { username: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return reply.send({ success: true, data: entregas });
  });
}
