import { FastifyRequest, FastifyReply } from 'fastify';
import { JwtPayload } from '../types';

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      reply.code(401).send({
        success: false,
        message: 'Token de autenticação não fornecido',
      });
      return;
    }

    const token = authHeader.substring(7);
    const payload = request.server.jwt.verify<JwtPayload>(token);

    if (payload.type !== 'access') {
      reply.code(401).send({
        success: false,
        message: 'Tipo de token inválido',
      });
      return;
    }

    request.userId = payload.userId;
  } catch (err) {
    reply.code(401).send({
      success: false,
      message: 'Token inválido ou expirado',
    });
  }
}
