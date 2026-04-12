import { FastifyRequest, FastifyReply } from 'fastify';

export async function requireAdmin(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const user = await request.server.prisma.user.findUnique({
    where: { id: request.userId },
    select: { role: true },
  });

  if (!user || user.role !== 'admin') {
    reply.code(403).send({
      success: false,
      message: 'Acesso restrito a administradores',
    });
  }
}
