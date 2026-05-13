import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/requireAdmin';

export async function adminRoutes(app: FastifyInstance) {
  // GET /admin/users — lista todos os usuários
  app.get('/admin/users', { preHandler: [authenticate, requireAdmin] }, async (request, reply) => {
    const users = await app.prisma.user.findMany({
      select: { id: true, username: true, firstName: true, lastName: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    return reply.send({ success: true, data: users });
  });

  // PATCH /admin/users/:id/role — altera o role de um usuário
  const roleSchema = z.object({ role: z.enum(['operator', 'admin']) });

  app.patch('/admin/users/:id/role', { preHandler: [authenticate, requireAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = roleSchema.parse(request.body);

    if (id === request.userId) {
      return reply.code(400).send({ success: false, message: 'Não é possível alterar seu próprio role' });
    }

    const user = await app.prisma.user.update({
      where: { id },
      data: { role: body.role },
      select: { id: true, username: true, role: true },
    });

    return reply.send({ success: true, user });
  });

  // POST /admin/users/:id/reset-password — admin redefine senha de operador
  const resetPasswordSchema = z.object({
    newPassword: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  });

  app.post('/admin/users/:id/reset-password', { preHandler: [authenticate, requireAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = resetPasswordSchema.parse(request.body);

    const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12');
    const passwordHash = await bcrypt.hash(body.newPassword, BCRYPT_ROUNDS);

    await app.prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    return reply.send({ success: true, message: 'Senha redefinida com sucesso' });
  });

  // GET /admin/records — lista todos os registros com filtros opcionais
  const adminRecordsQuerySchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    type: z.enum(['quebra', 'entrega', 'lamina', 'saida_voo', 'peso', 'contingente']).optional(),
    userId: z.string().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
  });

  app.get('/admin/records', { preHandler: [authenticate, requireAdmin] }, async (request, reply) => {
    const query = adminRecordsQuerySchema.parse(request.query);
    const skip = (query.page - 1) * query.limit;

    const dateRange = query.from && query.to ? {
      gte: new Date(query.from + 'T00:00:00.000Z'),
      lte: new Date(query.to + 'T23:59:59.999Z'),
    } : null;

    const createdAtFilter = dateRange ? { createdAt: dateRange } : {};
    const diaFilter = dateRange ? { dia: dateRange } : {};

    const userFilter = query.userId ? { userId: query.userId } : {};
    const where = { ...createdAtFilter, ...userFilter };
    const whereContingente = { ...diaFilter, ...userFilter };

    const [quebras, entregas, laminas, saidas, pesos, contingentes] = await Promise.all([
      app.prisma.quebra.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { username: true } } },
      }),
      app.prisma.entrega.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { awbs: true, user: { select: { username: true } } },
      }),
      app.prisma.laminaProduzida.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { username: true } } },
      }),
      app.prisma.saidaVoo.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { username: true } } },
      }),
      app.prisma.pesoMovimentado.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { username: true } } },
      }),
      app.prisma.contingente.findMany({
        where: whereContingente,
        orderBy: [{ dia: 'desc' }, { shift: 'asc' }],
        include: { user: { select: { username: true } } },
      }),
    ]);

    const all = [
      ...quebras.map((q) => ({ type: 'quebra' as const, createdAt: q.createdAt, data: q })),
      ...entregas.map((e) => ({ type: 'entrega' as const, createdAt: e.createdAt, data: e })),
      ...laminas.map((l) => ({ type: 'lamina' as const, createdAt: l.createdAt, data: l })),
      ...saidas.map((s) => ({ type: 'saida_voo' as const, createdAt: s.createdAt, data: s })),
      ...pesos.map((p) => ({ type: 'peso' as const, createdAt: p.createdAt, data: p })),
      ...contingentes.map((c) => ({ type: 'contingente' as const, createdAt: c.dia, data: c })),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const filtered = query.type ? all.filter((item) => item.type === query.type) : all;
    const total = filtered.length;
    const items = filtered.slice(skip, skip + query.limit);

    return reply.send({
      success: true,
      data: items,
      pagination: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) },
    });
  });

  // DELETE /admin/records/bulk — deleta múltiplos registros (DEVE estar ANTES de :type/:id)
  const bulkDeleteSchema = z.object({
    records: z.array(z.object({
      type: z.enum(['quebra', 'entrega', 'lamina', 'saida_voo', 'peso', 'contingente']),
      id: z.string(),
    })).min(1),
  });

  app.delete('/admin/records/bulk', { preHandler: [authenticate, requireAdmin] }, async (request, reply) => {
    const body = bulkDeleteSchema.parse(request.body);

    const byType = body.records.reduce<Record<string, string[]>>((acc, r) => {
      acc[r.type] = [...(acc[r.type] ?? []), r.id];
      return acc;
    }, {});

    await app.prisma.$transaction(async (tx) => {
      if (byType.quebra?.length) await tx.quebra.deleteMany({ where: { id: { in: byType.quebra } } });
      if (byType.entrega?.length) await tx.entrega.deleteMany({ where: { id: { in: byType.entrega } } });
      if (byType.lamina?.length) await tx.laminaProduzida.deleteMany({ where: { id: { in: byType.lamina } } });
      if (byType.saida_voo?.length) await tx.saidaVoo.deleteMany({ where: { id: { in: byType.saida_voo } } });
      if (byType.peso?.length) await tx.pesoMovimentado.deleteMany({ where: { id: { in: byType.peso } } });
      if (byType.contingente?.length) await tx.contingente.deleteMany({ where: { id: { in: byType.contingente } } });
    });

    return reply.send({ success: true, deleted: body.records.length });
  });

  // DELETE /admin/records/:type/:id — deleta um registro específico
  app.delete('/admin/records/:type/:id', { preHandler: [authenticate, requireAdmin] }, async (request, reply) => {
    const { type, id } = request.params as { type: string; id: string };

    if (type === 'quebra') {
      await app.prisma.quebra.delete({ where: { id } });
    } else if (type === 'entrega') {
      await app.prisma.entrega.delete({ where: { id } });
    } else if (type === 'lamina') {
      await app.prisma.laminaProduzida.delete({ where: { id } });
    } else if (type === 'saida_voo') {
      await app.prisma.saidaVoo.delete({ where: { id } });
    } else if (type === 'peso') {
      await app.prisma.pesoMovimentado.delete({ where: { id } });
    } else if (type === 'contingente') {
      await app.prisma.contingente.delete({ where: { id } });
    } else {
      return reply.code(400).send({ success: false, message: 'Tipo inválido' });
    }

    return reply.send({ success: true });
  });
}
