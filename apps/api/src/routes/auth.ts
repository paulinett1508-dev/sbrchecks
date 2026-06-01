import type { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { GoogleAuthInput } from '@sbrchecks/shared';
import { verifyGoogleToken } from '../lib/google.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../lib/token.js';
import { requireAuth } from '../middleware/requireAuth.js';

const prisma = new PrismaClient();
const REFRESH_COOKIE = 'refresh';
const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'strict' as const,
  path: '/',
  maxAge: 7 * 24 * 60 * 60,
  secure: process.env.NODE_ENV === 'production',
};

export async function authRoutes(app: FastifyInstance) {
  // POST /auth/google
  app.post('/google', async (request, reply) => {
    const body = GoogleAuthInput.safeParse(request.body);
    if (!body.success) {
      return reply.code(400).send({ error: 'idToken obrigatório' });
    }

    let googleUser;
    try {
      googleUser = await verifyGoogleToken(body.data.accessToken);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Token inválido';
      const isDomain = msg.includes('Domain not allowed');
      return reply
        .code(isDomain ? 403 : 401)
        .send({ error: isDomain ? 'Domínio não autorizado' : 'Token Google inválido' });
    }

    let user = await prisma.user.findUnique({
      where: { googleId: googleUser.googleId },
    });

    if (user) {
      if (!user.active) return reply.code(403).send({ error: 'Usuário desativado' });
      user = await prisma.user.update({ where: { id: user.id }, data: { name: googleUser.name } });
    } else {
      const byEmail = await prisma.user.findUnique({ where: { email: googleUser.email } });
      if (byEmail) {
        // pré-cadastrado: vincula googleId e ativa
        user = await prisma.user.update({
          where: { id: byEmail.id },
          data: { googleId: googleUser.googleId, name: googleUser.name, active: true },
        });
      } else if (googleUser.email === process.env.SEED_ADMIN_EMAIL) {
        // bootstrap do primeiro admin
        user = await prisma.user.create({
          data: { googleId: googleUser.googleId, email: googleUser.email, name: googleUser.name, role: 'ADMIN' },
        });
      } else {
        return reply.code(403).send({ error: 'Conta não autorizada. Solicite acesso ao administrador.' });
      }
    }

    const accessToken = signAccessToken({ sub: user.id, role: user.role });
    const refreshToken = signRefreshToken(user.id);

    reply.setCookie(REFRESH_COOKIE, refreshToken, COOKIE_OPTS);

    return reply.send({
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        active: user.active,
      },
    });
  });

  // POST /auth/refresh
  app.post('/refresh', async (request, reply) => {
    const token = request.cookies[REFRESH_COOKIE];
    if (!token) {
      return reply.code(401).send({ error: 'Sem refresh token' });
    }
    try {
      const { sub } = verifyRefreshToken(token);
      const user = await prisma.user.findUnique({ where: { id: sub } });
      if (!user || !user.active) {
        return reply.code(401).send({ error: 'Usuário não encontrado' });
      }
      const accessToken = signAccessToken({ sub: user.id, role: user.role });
      return reply.send({ accessToken });
    } catch {
      return reply.code(401).send({ error: 'Refresh token inválido' });
    }
  });

  // POST /auth/logout
  app.post('/logout', async (_request, reply) => {
    reply.clearCookie(REFRESH_COOKIE, { path: '/' });
    return reply.send({ ok: true });
  });

  // GET /auth/me
  app.get('/me', { preHandler: requireAuth }, async (request, reply) => {
    const user = await prisma.user.findUnique({
      where: { id: request.user.sub },
      select: { id: true, name: true, email: true, role: true, active: true },
    });
    if (!user) return reply.code(404).send({ error: 'Usuário não encontrado' });
    return reply.send(user);
  });
}
