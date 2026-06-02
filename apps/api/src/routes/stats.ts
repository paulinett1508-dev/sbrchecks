import type { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';

const prisma = new PrismaClient();

export async function statsRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: [requireAuth, requireRole('GERENTE')] }, async (_req, reply) => {
    const [pdvTotal, pdvActive, pdvNoCoords, userTotal, userActive, userPending] = await Promise.all([
      prisma.pdv.count(),
      prisma.pdv.count({ where: { active: true } }),
      prisma.pdv.count({ where: { latitude: null } }),
      prisma.user.count(),
      prisma.user.count({ where: { active: true } }),
      prisma.user.count({ where: { active: false, googleId: null } }),
    ]);
    return reply.send({
      pdvs: { total: pdvTotal, active: pdvActive, noCoords: pdvNoCoords },
      users: { total: userTotal, active: userActive, pending: userPending },
    });
  });
}
