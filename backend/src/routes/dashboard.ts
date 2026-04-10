import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { getDashboardSummary } from '../services/dashboardService';
import { format } from 'date-fns';

const querySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});

export async function dashboardRoutes(app: FastifyInstance) {
  app.get('/dashboard/summary', { preHandler: authenticate }, async (request, reply) => {
    const query = querySchema.parse(request.query);
    const now = new Date();
    const from = query.from || format(new Date(now.getFullYear(), now.getMonth(), 1), 'yyyy-MM-dd');
    const to = query.to || format(new Date(now.getFullYear(), now.getMonth() + 1, 0), 'yyyy-MM-dd');

    const data = await getDashboardSummary(app.prisma, from, to);
    return reply.send({ success: true, ...data });
  });
}
