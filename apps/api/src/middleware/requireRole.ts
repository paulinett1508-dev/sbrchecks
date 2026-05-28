import type { FastifyRequest, FastifyReply } from 'fastify';
import type { Role } from '@sbrchecks/shared';

const ROLE_RANK: Record<Role, number> = { GDD: 0, GERENTE: 1, ADMIN: 2 };

export function requireRole(minRole: Role) {
  return async function (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    if (ROLE_RANK[request.user.role] < ROLE_RANK[minRole]) {
      return reply.code(403).send({ error: 'Forbidden' });
    }
  };
}
