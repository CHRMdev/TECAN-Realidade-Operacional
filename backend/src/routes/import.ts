import { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/auth';
import { generateTemplate, processImport } from '../services/importService';

export async function importRoutes(app: FastifyInstance) {
  app.get('/import/template', { preHandler: authenticate }, async (_request, reply) => {
    const users = await app.prisma.user.findMany({
      select: { username: true },
      orderBy: { username: 'asc' },
    });
    const buffer = await generateTemplate(users.map((u) => u.username));
    return reply
      .header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      .header('Content-Disposition', 'attachment; filename="tecan-template.xlsx"')
      .send(buffer);
  });

  app.post('/import/excel', { preHandler: authenticate }, async (request, reply) => {
    const file = await request.file();
    if (!file) {
      return reply.code(400).send({ success: false, message: 'Nenhum arquivo enviado' });
    }
    const buffer = await file.toBuffer();
    const result = await processImport(app.prisma, buffer, request.userId);
    return reply.send({ success: true, ...result });
  });
}
