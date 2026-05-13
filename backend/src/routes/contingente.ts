import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';

const createSchema = z.object({
  shift: z.enum(['A', 'B', 'C']),
  quantidadeTripulantes: z.number().int().positive('Quantidade deve ser maior que zero'),
  dia: z.string().optional(),
});

function parseDia(diaInput?: string): Date {
  if (diaInput) {
    const parsed = new Date(diaInput + 'T00:00:00.000Z');
    if (isNaN(parsed.getTime())) throw new Error('Data inválida');
    return parsed;
  }
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export async function contingenteRoutes(app: FastifyInstance) {
  app.post('/contingente', { preHandler: authenticate }, async (request, reply) => {
    const body = createSchema.parse(request.body);
    const dia = parseDia(body.dia);

    const contingente = await app.prisma.contingente.upsert({
      where: { dia_shift: { dia, shift: body.shift } },
      update: {
        quantidadeTripulantes: body.quantidadeTripulantes,
        userId: request.userId,
      },
      create: {
        userId: request.userId,
        shift: body.shift,
        quantidadeTripulantes: body.quantidadeTripulantes,
        dia,
      },
      include: { user: { select: { username: true, firstName: true, lastName: true } } },
    });

    return reply.code(201).send({ success: true, contingente });
  });

  app.get('/contingente', { preHandler: authenticate }, async (_request, reply) => {
    const contingentes = await app.prisma.contingente.findMany({
      orderBy: [{ dia: 'desc' }, { shift: 'asc' }],
      include: { user: { select: { username: true, firstName: true, lastName: true } } },
    });
    return reply.send({ success: true, data: contingentes });
  });
}
