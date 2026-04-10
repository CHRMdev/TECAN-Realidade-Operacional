import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  from: z.string().optional(),
  to: z.string().optional(),
});

export async function historicoRoutes(app: FastifyInstance) {
  app.get('/historico', { preHandler: authenticate }, async (request, reply) => {
    const query = querySchema.parse(request.query);
    const skip = (query.page - 1) * query.limit;

    const dateFilter =
      query.from && query.to
        ? {
            createdAt: {
              gte: new Date(query.from + 'T00:00:00.000Z'),
              lte: new Date(query.to + 'T23:59:59.999Z'),
            },
          }
        : {};

    const [quebras, entregas, laminas, saidas] = await Promise.all([
      app.prisma.quebra.findMany({
        where: { userId: request.userId, ...dateFilter },
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { username: true } } },
      }),
      app.prisma.entrega.findMany({
        where: { userId: request.userId, ...dateFilter },
        orderBy: { createdAt: 'desc' },
        include: { awbs: true, user: { select: { username: true } } },
      }),
      app.prisma.laminaProduzida.findMany({
        where: { userId: request.userId, ...dateFilter },
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { username: true } } },
      }),
      app.prisma.saidaVoo.findMany({
        where: { userId: request.userId, ...dateFilter },
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { username: true } } },
      }),
    ]);

    // Merge all into unified timeline
    const all = [
      ...quebras.map((q) => ({ type: 'quebra', createdAt: q.createdAt, data: q })),
      ...entregas.map((e) => ({ type: 'entrega', createdAt: e.createdAt, data: e })),
      ...laminas.map((l) => ({ type: 'lamina', createdAt: l.createdAt, data: l })),
      ...saidas.map((s) => ({ type: 'saida_voo', createdAt: s.createdAt, data: s })),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = all.length;
    const items = all.slice(skip, skip + query.limit);

    return reply.send({
      success: true,
      data: items,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    });
  });
}
