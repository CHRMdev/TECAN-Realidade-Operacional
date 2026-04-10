import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { exportExcel, exportPdf } from '../services/exportService';
import { format } from 'date-fns';

const querySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});

export async function exportRoutes(app: FastifyInstance) {
  app.get('/export/excel', { preHandler: authenticate }, async (request, reply) => {
    const query = querySchema.parse(request.query);
    const now = new Date();
    const from = query.from || format(new Date(now.getFullYear(), now.getMonth(), 1), 'yyyy-MM-dd');
    const to = query.to || format(new Date(now.getFullYear(), now.getMonth() + 1, 0), 'yyyy-MM-dd');

    const buffer = await exportExcel(app.prisma, from, to);
    return reply
      .header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      .header('Content-Disposition', `attachment; filename="tecan-${from}-${to}.xlsx"`)
      .send(buffer);
  });

  app.get('/export/pdf', { preHandler: authenticate }, async (request, reply) => {
    const query = querySchema.parse(request.query);
    const now = new Date();
    const from = query.from || format(new Date(now.getFullYear(), now.getMonth(), 1), 'yyyy-MM-dd');
    const to = query.to || format(new Date(now.getFullYear(), now.getMonth() + 1, 0), 'yyyy-MM-dd');

    const buffer = await exportPdf(app.prisma, from, to);
    return reply
      .header('Content-Type', 'application/pdf')
      .header('Content-Disposition', `attachment; filename="tecan-${from}-${to}.pdf"`)
      .send(buffer);
  });
}
