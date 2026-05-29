const ALLOWED_DOMAIN = process.env.ALLOWED_DOMAIN ?? 'laboratoriosobral.com.br';

export interface GoogleUser {
  googleId: string;
  email: string;
  name: string;
}

interface GoogleUserInfo {
  sub: string;
  email: string;
  name?: string;
  hd?: string;
}

export async function verifyGoogleToken(accessToken: string): Promise<GoogleUser> {
  const res = await fetch(
    'https://www.googleapis.com/oauth2/v3/userinfo',
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) throw new Error('Token Google inválido');

  const info = (await res.json()) as GoogleUserInfo;

  if (info.hd !== ALLOWED_DOMAIN) {
    throw new Error(`Domain not allowed: ${info.hd ?? 'unknown'}`);
  }
  return {
    googleId: info.sub,
    email: info.email,
    name: info.name ?? info.email,
  };
}
