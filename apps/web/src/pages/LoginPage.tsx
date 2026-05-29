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
      {/* Fundo full-screen + overlay */}
      <img src="/bg_login.png" alt="" className="login-left-bg" />
      <div className="login-overlay" />

      {/* Decorações: 4 cantos + círculo + linhas */}
      <div className="login-deco-corner-tl" />
      <div className="login-deco-corner-tr" />
      <div className="login-deco-corner-bl" />
      <div className="login-deco-corner-br" />
      <div className="login-deco-circle" />
      <svg
        className="login-deco-lines"
        viewBox="0 0 1440 900"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        <line x1="0" y1="300" x2="300" y2="0" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
        <line x1="0" y1="600" x2="600" y2="0" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
        <line x1="200" y1="900" x2="900" y2="200" stroke="rgba(255,255,255,0.035)" strokeWidth="1" />
        <circle cx="720" cy="450" r="320" fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="1" />
      </svg>

      {/* Marca flutuante — esquerda */}
      <div className="login-left">
        <img src="/logo1_transp.svg" alt="Laboratório Sobral" className="login-left-logo" />
        <h1>SBRChecks</h1>
        <p className="brand-sub">Gestão de Visitas a PDVs</p>
      </div>

      {/* Card — direita */}
      <div className="login-right">
        <div className="login-card">
          <div className="login-card-header">
            <img src="/logo115-background.svg" alt="" className="login-card-header-logo" />
          </div>
          <div className="login-card-body">
            <h2>Entre na sua conta</h2>
            <p className="subtitle">Área restrita · Colaboradores autorizados</p>
            <div className="card-divider" />

            {error && <p className="login-error">{error}</p>}

            {loading ? (
              <p style={{ color: 'rgba(255,255,255,.5)', fontSize: '.85rem' }}>Autenticando…</p>
            ) : (
              <div className="google-btn-wrapper">
                <GoogleLogin
                  onSuccess={handleSuccess}
                  onError={() => setError('Login Google cancelado ou falhou.')}
                  text="signin_with_google"
                  locale="pt-BR"
                  theme="filled_blue"
                  size="large"
                  width="320"
                />
              </div>
            )}

            <p className="card-footer">Apenas colaboradores @laboratoriosobral.com.br</p>
          </div>
        </div>
      </div>
    </div>
  );
}
