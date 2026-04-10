import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';

export function errorHandler(
  error: FastifyError | ZodError | Error,
  request: FastifyRequest,
  reply: FastifyReply
): void {
  if (error instanceof ZodError) {
    reply.code(422).send({
      success: false,
      message: 'Dados inválidos',
      errors: error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  const fastifyError = error as FastifyError;
  if (fastifyError.statusCode) {
    reply.code(fastifyError.statusCode).send({
      success: false,
      message: fastifyError.message,
    });
    return;
  }

  if (
    error.message?.includes('jwt') ||
    error.message?.includes('token') ||
    error.message?.includes('Unauthorized')
  ) {
    reply.code(401).send({
      success: false,
      message: 'Token inválido ou expirado',
    });
    return;
  }

  if (error.constructor?.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as any;
    if (prismaError.code === 'P2002') {
      reply.code(409).send({ success: false, message: 'Registro duplicado' });
      return;
    }
    if (prismaError.code === 'P2025') {
      reply.code(404).send({ success: false, message: 'Registro não encontrado' });
      return;
    }
  }

  request.log.error(error);
  reply.code(500).send({ success: false, message: 'Erro interno do servidor' });
}
