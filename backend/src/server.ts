import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { PrismaClient } from '@prisma/client';
import { authRoutes } from './routes/auth';
import { quebrasRoutes } from './routes/quebras';
import { entregasRoutes } from './routes/entregas';
import { laminasProduzidasRoutes } from './routes/laminasProduzidas';
import { saidasVooRoutes } from './routes/saidasVoo';
import { dashboardRoutes } from './routes/dashboard';
import { exportRoutes } from './routes/export';
import { historicoRoutes } from './routes/historico';
import { errorHandler } from './middleware/errorHandler';

const prisma = new PrismaClient();
const app = Fastify({ logger: true });

async function bootstrap() {
  await app.register(cors, {
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176'],
    credentials: true,
  });

  await app.register(jwt, {
    secret: process.env.JWT_SECRET!,
  });

  app.decorate('prisma', prisma);

  app.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  }));

  await app.register(authRoutes, { prefix: '/auth' });
  await app.register(quebrasRoutes, { prefix: '/api' });
  await app.register(entregasRoutes, { prefix: '/api' });
  await app.register(laminasProduzidasRoutes, { prefix: '/api' });
  await app.register(saidasVooRoutes, { prefix: '/api' });
  await app.register(dashboardRoutes, { prefix: '/api' });
  await app.register(exportRoutes, { prefix: '/api' });
  await app.register(historicoRoutes, { prefix: '/api' });

  app.setErrorHandler(errorHandler);

  const PORT = parseInt(process.env.PORT || '3002');
  await app.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`TECAN Backend rodando em http://localhost:${PORT}`);
}

bootstrap().catch((err) => {
  console.error('Erro ao iniciar o servidor:', err);
  process.exit(1);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  await app.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  await app.close();
  process.exit(0);
});
