import Fastify, { type FastifyInstance } from 'fastify';
import cookie from '@fastify/cookie';
import './types.js';
import { authRoutes } from './routes/auth.js';
import { usersRoutes } from './routes/users.js';

export async function createApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: process.env.NODE_ENV !== 'test',
  });

  await app.register(cookie);

  app.get('/health', async () => ({ status: 'ok' }));
  await app.register(authRoutes, { prefix: '/auth' });
  await app.register(usersRoutes, { prefix: '/users' });

  return app;
}
