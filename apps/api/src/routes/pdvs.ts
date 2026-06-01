import type { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { PdvInput, AssignPdvInput } from '@sbrchecks/shared';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';

const prisma = new PrismaClient();

const PDV_SELECT = {
  id: true,
  name: true,
  document: true,
  address: true,
  latitude: true,
  longitude: true,
  radiusM: true,
  active: true,
} as const;

export async function pdvsRoutes(app: FastifyInstance) {
  // GET /pdvs — lista paginada
  app.get('/', { preHandler: [requireAuth, requireRole('GERENTE')] }, async (request, reply) => {
    const { page = '1', pageSize = '20', noCoords, q } = request.query as {
      page?: string;
      pageSize?: string;
      noCoords?: string;
      q?: string;
    };
    const skip = (Number(page) - 1) * Number(pageSize);
    const where = {
      ...(noCoords === 'true' ? { latitude: null } : {}),
      ...(q ? { name: { contains: q, mode: 'insensitive' as const } } : {}),
    };
    const [pdvs, total] = await Promise.all([
      prisma.pdv.findMany({ where, select: PDV_SELECT, skip, take: Number(pageSize), orderBy: { name: 'asc' } }),
      prisma.pdv.count({ where }),
    ]);
    return reply.send({ data: pdvs, total, page: Number(page), pageSize: Number(pageSize) });
  });

  // POST /pdvs
  app.post('/', { preHandler: [requireAuth, requireRole('GERENTE')] }, async (request, reply) => {
    const body = PdvInput.safeParse(request.body);
    if (!body.success) return reply.code(400).send({ error: body.error.flatten() });
    const pdv = await prisma.pdv.create({ data: body.data, select: PDV_SELECT });
    return reply.code(201).send(pdv);
  });

  // GET /pdvs/:id
  app.get('/:id', { preHandler: [requireAuth, requireRole('GERENTE')] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const pdv = await prisma.pdv.findUnique({ where: { id }, select: PDV_SELECT });
    if (!pdv) return reply.code(404).send({ error: 'PDV não encontrado' });
    return reply.send(pdv);
  });

  // PATCH /pdvs/:id
  app.patch('/:id', { preHandler: [requireAuth, requireRole('GERENTE')] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = PdvInput.partial().safeParse(request.body);
    if (!body.success) return reply.code(400).send({ error: body.error.flatten() });
    try {
      const pdv = await prisma.pdv.update({ where: { id }, data: body.data, select: PDV_SELECT });
      return reply.send(pdv);
    } catch {
      return reply.code(404).send({ error: 'PDV não encontrado' });
    }
  });

  // DELETE /pdvs/:id — soft delete
  app.delete('/:id', { preHandler: [requireAuth, requireRole('GERENTE')] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      await prisma.pdv.update({ where: { id }, data: { active: false } });
      return reply.code(204).send();
    } catch {
      return reply.code(404).send({ error: 'PDV não encontrado' });
    }
  });
}
