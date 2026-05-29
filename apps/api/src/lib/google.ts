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
}

interface UserInfo {
  sub: string;
  name?: string;
  email: string;
  email_verified?: boolean;
  hd?: string;
}

export async function verifyGoogleToken(accessToken: string): Promise<GoogleUser> {
  // 1. Validar audience — impede token substitution de outras apps
  const tokenRes = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`
  );
  if (!tokenRes.ok) throw new Error('Token Google inválido');

  const tokenInfo = (await tokenRes.json()) as TokenInfo;

  if (tokenInfo.aud !== CLIENT_ID && tokenInfo.azp !== CLIENT_ID) {
    throw new Error('Token not issued for this application');
  }

  // 2. Buscar perfil do usuário
  const userRes = await fetch(
    'https://www.googleapis.com/oauth2/v3/userinfo',
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!userRes.ok) throw new Error('Falha ao obter perfil Google');

  const userInfo = (await userRes.json()) as UserInfo;

  // 3. Email deve estar verificado pelo Google
  if (!userInfo.email_verified) {
    throw new Error('Email not verified by Google');
  }

  // 4. Validar domínio via hd (hosted domain) do userinfo — mais confiável que email split
  //    hd só está presente em contas Google Workspace da organização
  if (userInfo.hd !== ALLOWED_DOMAIN) {
    throw new Error(`Domain not allowed: ${userInfo.hd ?? 'unknown'}`);
  }

  return {
    googleId: userInfo.sub,
    email: userInfo.email,
    name: userInfo.name ?? userInfo.email,
  };
}
