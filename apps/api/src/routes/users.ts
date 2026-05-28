import type { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { UpdateRoleInput } from '@sbrchecks/shared';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';

const prisma = new PrismaClient();

export async function usersRoutes(app: FastifyInstance) {
  // GET /users — GERENTE e ADMIN
  app.get(
    '/',
    { preHandler: [requireAuth, requireRole('GERENTE')] },
    async (_request, reply) => {
      const users = await prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true, active: true },
        orderBy: { name: 'asc' },
      });
      return reply.send(users);
    }
  );

  // PATCH /users/:id/role — só ADMIN
  app.patch(
    '/:id/role',
    { preHandler: [requireAuth, requireRole('ADMIN')] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = UpdateRoleInput.safeParse(request.body);
      if (!body.success) {
        return reply.code(400).send({ error: 'Papel inválido' });
      }
      const user = await prisma.user.update({
        where: { id },
        data: { role: body.data.role },
        select: { id: true, name: true, email: true, role: true },
      });
      return reply.send(user);
    }
  );
}
