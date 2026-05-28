import jwt from 'jsonwebtoken';
import type { Role } from '@sbrchecks/shared';

export interface AccessPayload {
  sub: string;
  role: Role;
}

interface RefreshPayload {
  sub: string;
  type: 'refresh';
}

export function signAccessToken(payload: AccessPayload): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '15m' });
}

export function signRefreshToken(sub: string): string {
  return jwt.sign(
    { sub, type: 'refresh' } satisfies RefreshPayload,
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: '7d' }
  );
}

export function verifyAccessToken(token: string): AccessPayload {
  return jwt.verify(token, process.env.JWT_SECRET!) as AccessPayload;
}

export function verifyRefreshToken(token: string): { sub: string } {
  const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as RefreshPayload;
  if (payload.type !== 'refresh') throw new Error('Invalid token type');
  return { sub: payload.sub };
}
