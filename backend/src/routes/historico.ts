import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  from: z.string().optional(),
  to: z.string().optional(),
  type: z.enum(['quebra', 'entrega', 'lamina', 'saida_voo', 'peso', 'contingente']).optional(),
});

export async function historicoRoutes(app: FastifyInstance) {
  app.get('/historico', { preHandler: authenticate }, async (request, reply) => {
    const query = querySchema.parse(request.query);
    const skip = (query.page - 1) * query.limit;

    const dateRange =
      query.from && query.to
        ? { gte: new Date(query.from + 'T00:00:00.000Z'), lte: new Date(query.to + 'T23:59:59.999Z') }
        : null;

    const createdAtFilter = dateRange ? { createdAt: dateRange } : {};
    const diaFilter = dateRange ? { dia: dateRange } : {};

    const [quebras, entregas, laminas, saidas, pesos, contingentes] = await Promise.all([
      app.prisma.quebra.findMany({
        where: { userId: request.userId, ...createdAtFilter },
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { username: true } } },
      }),
      app.prisma.entrega.findMany({
        where: { userId: request.userId, ...createdAtFilter },
        orderBy: { createdAt: 'desc' },
        include: { awbs: true, user: { select: { username: true } } },
      }),
      app.prisma.laminaProduzida.findMany({
        where: { userId: request.userId, ...createdAtFilter },
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { username: true } } },
      }),
      app.prisma.saidaVoo.findMany({
        where: { userId: request.userId, ...createdAtFilter },
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { username: true } } },
      }),
      app.prisma.pesoMovimentado.findMany({
        where: { userId: request.userId, ...createdAtFilter },
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { username: true } } },
      }),
      app.prisma.contingente.findMany({
        where: { ...diaFilter },
        orderBy: [{ dia: 'desc' }, { shift: 'asc' }],
        include: { user: { select: { username: true } } },
      }),
    ]);

    // Merge all into unified timeline
    const all = [
      ...quebras.map((q) => ({ type: 'quebra', createdAt: q.createdAt, data: q })),
      ...entregas.map((e) => ({ type: 'entrega', createdAt: e.createdAt, data: e })),
      ...laminas.map((l) => ({ type: 'lamina', createdAt: l.createdAt, data: l })),
      ...saidas.map((s) => ({ type: 'saida_voo', createdAt: s.createdAt, data: s })),
      ...pesos.map((p) => ({ type: 'peso', createdAt: p.createdAt, data: p })),
      ...contingentes.map((c) => ({ type: 'contingente', createdAt: c.dia, data: c })),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const filtered = query.type ? all.filter((item) => item.type === query.type) : all;
    const total = filtered.length;
    const items = filtered.slice(skip, skip + query.limit);

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
