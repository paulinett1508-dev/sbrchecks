import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { createApp } from '../app.js';
import type { FastifyInstance } from 'fastify';

const CLIENT_ID = 'test-client-id';

// Mock fetch: tokeninfo (audience validation) + userinfo (profile)
const mockFetch = vi.fn().mockImplementation((url: string) => {
  if (String(url).includes('tokeninfo')) {
    return Promise.resolve({
      ok: true,
      json: async () => ({
        aud: CLIENT_ID,
        azp: CLIENT_ID,
        sub: 'google-test-id-001',
        email: 'test.user@laboratoriosobral.com.br',
        hd: 'laboratoriosobral.com.br',
      }),
    });
  }
  // userinfo
  return Promise.resolve({
    ok: true,
    json: async () => ({
      sub: 'google-test-id-001',
      email: 'test.user@laboratoriosobral.com.br',
      name: 'Test User',
    }),
  });
});
vi.stubGlobal('fetch', mockFetch);

// Mock Prisma
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({
    user: {
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({
        id: 'user-id-001',
        googleId: 'google-test-id-001',
        email: 'test.user@laboratoriosobral.com.br',
        name: 'Test User',
        role: 'GDD',
        active: true,
      }),
      update: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
    },
  })),
}));

let app: FastifyInstance;

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-secret-access';
  process.env.JWT_REFRESH_SECRET = 'test-secret-refresh';
  process.env.GOOGLE_CLIENT_ID = CLIENT_ID;
  process.env.ALLOWED_DOMAIN = 'laboratoriosobral.com.br';
  app = await createApp();
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

describe('POST /auth/google', () => {
  it('retorna 400 sem accessToken', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/google',
      payload: {},
    });
    expect(res.statusCode).toBe(400);
  });

  it('retorna accessToken e user no primeiro login', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/google',
      payload: { accessToken: 'mock-valid-token' },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ accessToken: string; user: { role: string } }>();
    expect(body.accessToken).toBeDefined();
    expect(body.user.role).toBe('GDD');
  });

  it('seta cookie refresh HttpOnly', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/google',
      payload: { accessToken: 'mock-valid-token' },
    });
    const cookies = res.headers['set-cookie'] as string | string[];
    const cookieStr = Array.isArray(cookies) ? cookies.join('; ') : cookies;
    expect(cookieStr).toContain('refresh=');
    expect(cookieStr).toContain('HttpOnly');
  });
});

describe('GET /auth/me', () => {
  it('retorna 401 sem token', async () => {
    const res = await app.inject({ method: 'GET', url: '/auth/me' });
    expect(res.statusCode).toBe(401);
  });
});

describe('GET /health', () => {
  it('retorna status ok', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok' });
  });
});
