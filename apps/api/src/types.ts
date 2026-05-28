declare module 'fastify' {
  interface FastifyRequest {
    user: {
      sub: string;
      role: 'GDD' | 'GERENTE' | 'ADMIN';
    };
  }
}
export {};
