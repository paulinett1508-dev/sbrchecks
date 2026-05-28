import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const ALLOWED_DOMAIN = process.env.ALLOWED_DOMAIN ?? 'laboratoriosobral.com.br';

export interface GoogleUser {
  googleId: string;
  email: string;
  name: string;
}

export async function verifyGoogleToken(idToken: string): Promise<GoogleUser> {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  if (!payload) throw new Error('Empty payload');
  if (payload.hd !== ALLOWED_DOMAIN) {
    throw new Error(`Domain not allowed: ${payload.hd}`);
  }
  return {
    googleId: payload.sub,
    email: payload.email!,
    name: payload.name ?? payload.email!,
  };
}
