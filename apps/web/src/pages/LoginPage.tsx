import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserDto } from '@sbrchecks/shared';
import { useAuth } from '../hooks/useAuth';
import '../login.css';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/auth/google`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: credentialResponse.credential }),
      });
      if (res.status === 403) {
        navigate('/unauthorized');
        return;
      }
      if (!res.ok) {
        setError('Falha ao autenticar. Tente novamente.');
        return;
      }
      const raw = await res.json();
      const parsed = UserDto.safeParse((raw as { user: unknown }).user);
      if (!parsed.success) {
        setError('Resposta inesperada do servidor.');
        return;
      }
      login((raw as { accessToken: string }).accessToken, parsed.data);
      navigate('/');
    } catch {
      setError('Falha de conexão. Verifique a rede.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      {/* Painel esquerdo */}
      <div className="login-left">
        <img src="/bg_login.webp" alt="" className="login-left-bg" />
        <div className="login-overlay" />
        <div className="login-left-deco" />
        <div className="login-deco-circle" />
        <div className="login-deco-corner-tr" />
        <div className="login-deco-corner-bl" />
        <svg
          className="login-deco-lines"
          viewBox="0 0 500 700"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
        >
          <line x1="0" y1="200" x2="200" y2="0" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
          <line x1="0" y1="350" x2="350" y2="0" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          <line x1="50" y1="700" x2="500" y2="250" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
          <circle cx="420" cy="80" r="60" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
          <circle cx="80" cy="620" r="80" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
        </svg>
        <div className="login-left-content">
          <img src="/logo1_transp.svg" alt="Laboratório Sobral" className="login-left-logo" />
          <h1>SBRChecks</h1>
          <p className="brand-sub">Laboratório Sobral</p>
        </div>
      </div>

      {/* Painel direito */}
      <div className="login-right">
        <div className="login-card">
          <div className="login-card-header">
            <img src="/logo115-background.svg" alt="" className="login-card-header-logo" />
          </div>
          <div className="login-card-body">
            <h2>Entrar no SBRChecks</h2>
            <p className="subtitle">Área restrita · Colaboradores autorizados</p>
            <div className="card-divider" />

            {error && <p className="login-error">{error}</p>}

            {loading ? (
              <p style={{ color: 'rgba(255,255,255,.6)', fontSize: '.9rem' }}>Autenticando…</p>
            ) : (
              <GoogleLogin
                onSuccess={handleSuccess}
                onError={() => setError('Login Google cancelado ou falhou.')}
                text="signin_with_google"
                locale="pt-BR"
                theme="filled_blue"
                size="large"
                width="100%"
              />
            )}

            <p className="card-footer">Apenas colaboradores @laboratoriosobral.com.br</p>
          </div>
        </div>
      </div>
    </div>
  );
}
