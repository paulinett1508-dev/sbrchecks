import type { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { CreateUserInput, UpdateUserInput, AssignPdvInput } from '@sbrchecks/shared';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';

const prisma = new PrismaClient();

const USER_SELECT = { id: true, name: true, email: true, role: true, active: true, googleId: true } as const;
const WALLET_SELECT = { id: true, name: true, address: true, latitude: true, longitude: true, radiusM: true } as const;

export async function usersRoutes(app: FastifyInstance) {
  // GET /users — GERENTE+
  app.get('/', { preHandler: [requireAuth, requireRole('GERENTE')] }, async (_request, reply) => {
    const users = await prisma.user.findMany({
      select: USER_SELECT,
      orderBy: { name: 'asc' },
    });
    return reply.send(users);
  });

  // POST /users — pré-cadastro (ADMIN only)
  app.post('/', { preHandler: [requireAuth, requireRole('ADMIN')] }, async (request, reply) => {
    const body = CreateUserInput.safeParse(request.body);
    if (!body.success) return reply.code(400).send({ error: body.error.flatten() });
    const existing = await prisma.user.findUnique({ where: { email: body.data.email } });
    if (existing) return reply.code(409).send({ error: 'Email já cadastrado' });
    const user = await prisma.user.create({
      data: { ...body.data, active: false },
      select: USER_SELECT,
    });
    return reply.code(201).send(user);
  });

  // PATCH /users/:id — edita nome, papel e/ou status (ADMIN only)
  app.patch('/:id', { preHandler: [requireAuth, requireRole('ADMIN')] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = UpdateUserInput.safeParse(request.body);
    if (!body.success) return reply.code(400).send({ error: body.error.flatten() });
    try {
      const user = await prisma.user.update({ where: { id }, data: body.data, select: USER_SELECT });
      return reply.send(user);
    } catch {
      return reply.code(404).send({ error: 'Usuário não encontrado' });
    }
  });

  // DELETE /users/:id — desativa (ADMIN only)
  app.delete('/:id', { preHandler: [requireAuth, requireRole('ADMIN')] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      await prisma.user.update({ where: { id }, data: { active: false } });
      return reply.code(204).send();
    } catch {
      return reply.code(404).send({ error: 'Usuário não encontrado' });
    }
  });

  // GET /users/:id/wallet — lista carteira do usuário (GERENTE+)
  app.get('/:id/wallet', { preHandler: [requireAuth, requireRole('GERENTE')] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const assignments = await prisma.pdvAssignment.findMany({
      where: { userId: id },
      include: { pdv: { select: WALLET_SELECT } },
      orderBy: { pdv: { name: 'asc' } },
    });
    return reply.send(assignments.map((a) => a.pdv));
  });

  // POST /users/:id/wallet — atribui PDV (GERENTE+)
  app.post('/:id/wallet', { preHandler: [requireAuth, requireRole('GERENTE')] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = AssignPdvInput.safeParse(request.body);
    if (!body.success) return reply.code(400).send({ error: body.error.flatten() });
    await prisma.pdvAssignment.upsert({
      where: { userId_pdvId: { userId: id, pdvId: body.data.pdvId } },
      create: { userId: id, pdvId: body.data.pdvId },
      update: {},
    });
    return reply.code(201).send({ ok: true });
  });

  // DELETE /users/:id/wallet/:pdvId — remove PDV da carteira (GERENTE+)
  app.delete('/:id/wallet/:pdvId', { preHandler: [requireAuth, requireRole('GERENTE')] }, async (request, reply) => {
    const { id, pdvId } = request.params as { id: string; pdvId: string };
    try {
      await prisma.pdvAssignment.delete({ where: { userId_pdvId: { userId: id, pdvId } } });
      return reply.code(204).send();
    } catch {
      return reply.code(404).send({ error: 'Atribuição não encontrada' });
    }
  });
}
