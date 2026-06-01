import type { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/requireAuth.js';

const prisma = new PrismaClient();

const WALLET_SELECT = { id: true, name: true, address: true, latitude: true, longitude: true, radiusM: true } as const;

export async function meRoutes(app: FastifyInstance) {
  // GET /me/wallet — carteira do GDD logado (sync PWA)
  app.get('/wallet', { preHandler: requireAuth }, async (request, reply) => {
    const assignments = await prisma.pdvAssignment.findMany({
      where: { userId: request.user.sub },
      include: { pdv: { select: WALLET_SELECT } },
      orderBy: { pdv: { name: 'asc' } },
    });
    return reply.send(assignments.map((a) => a.pdv));
  });
}
