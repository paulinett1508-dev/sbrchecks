import type { FastifyRequest, FastifyReply } from 'fastify';
import { verifyAccessToken } from '../lib/token.js';

export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const auth = request.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }
  try {
    request.user = verifyAccessToken(auth.slice(7));
  } catch {
    return reply.code(401).send({ error: 'Invalid or expired token' });
  }
}
