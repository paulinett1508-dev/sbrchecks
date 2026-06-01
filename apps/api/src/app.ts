import Fastify, { type FastifyInstance } from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import './types.js';
import { authRoutes } from './routes/auth.js';
import { usersRoutes } from './routes/users.js';
import { pdvsRoutes } from './routes/pdvs.js';
import { meRoutes } from './routes/me.js';

// CORS_ORIGIN pode ser uma lista separada por vírgula no .env
const ALLOWED_ORIGINS = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim())
  : process.env.NODE_ENV === 'production'
  ? ['https://sbrchecks.laboratoriosobral.com.br']
  : ['http://localhost:5173'];

export async function createApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: process.env.NODE_ENV !== 'test',
  });

  await app.register(cors, {
    origin: ALLOWED_ORIGINS,
    credentials: true,   // necessário para o cookie HttpOnly do refresh token
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  });
  await app.register(cookie);

  app.get('/health', async () => ({ status: 'ok' }));
  await app.register(authRoutes, { prefix: '/auth' });
  await app.register(usersRoutes, { prefix: '/users' });
  await app.register(pdvsRoutes, { prefix: '/pdvs' });
  await app.register(meRoutes, { prefix: '/me' });

  return app;
}
