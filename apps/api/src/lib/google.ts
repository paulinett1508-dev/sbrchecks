const ALLOWED_DOMAIN = process.env.ALLOWED_DOMAIN ?? 'laboratoriosobral.com.br';
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? '';

export interface GoogleUser {
  googleId: string;
  email: string;
  name: string;
}

interface TokenInfo {
  aud?: string;
  azp?: string;
  sub?: string;
  email?: string;
  hd?: string;
}

interface UserInfo {
  sub: string;
  name?: string;
  email: string;
}

export async function verifyGoogleToken(accessToken: string): Promise<GoogleUser> {
  // 1. Validar audience — impede que tokens de outras apps sejam aceitos aqui
  const tokenRes = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`
  );
  if (!tokenRes.ok) throw new Error('Token Google inválido');

  const tokenInfo = (await tokenRes.json()) as TokenInfo;

  // aud ou azp devem ser o client ID desta aplicação
  if (tokenInfo.aud !== CLIENT_ID && tokenInfo.azp !== CLIENT_ID) {
    throw new Error('Token not issued for this application');
  }

  // 2. Validar domínio hosted (G Suite)
  if (tokenInfo.hd !== ALLOWED_DOMAIN) {
    throw new Error(`Domain not allowed: ${tokenInfo.hd ?? 'unknown'}`);
  }

  // 3. Buscar perfil do usuário (para name)
  const userRes = await fetch(
    'https://www.googleapis.com/oauth2/v3/userinfo',
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!userRes.ok) throw new Error('Falha ao obter perfil Google');

  const userInfo = (await userRes.json()) as UserInfo;

  return {
    googleId: userInfo.sub,
    email: userInfo.email,
    name: userInfo.name ?? userInfo.email,
  };
}
