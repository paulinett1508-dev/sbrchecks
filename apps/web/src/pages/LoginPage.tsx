import { useGoogleLogin } from '@react-oauth/google';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { UserDto } from '@sbrchecks/shared';
import '../login.css';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGoogle = useGoogleLogin({
    onSuccess: async ({ credential }) => {
      if (!credential) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API}/auth/google`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken: credential }),
        });
        if (res.status === 403) {
          navigate('/unauthorized');
          return;
        }
        if (!res.ok) {
          setError('Falha ao autenticar. Tente novamente.');
          return;
        }
        const data = (await res.json()) as {
          accessToken: string;
          user: UserDto;
        };
        login(data.accessToken, data.user);
        navigate('/');
      } catch {
        setError('Falha de conexão. Verifique a rede.');
      } finally {
        setLoading(false);
      }
    },
    onError: () => setError('Login Google cancelado ou falhou.'),
    flow: 'implicit',
  });

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

            <button
              className="btn-submit"
              onClick={() => handleGoogle()}
              disabled={loading}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              {loading ? 'Autenticando…' : (
                <>
                  <svg width="18" height="18" viewBox="0 0 48 48">
                    <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-8.9 20-20 0-1.3-.1-2.7-.4-4z"/>
                    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
                    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.4 35.5 26.8 36 24 36c-5.2 0-9.6-3-11.3-7.3l-6.5 5C9.6 39.6 16.3 44 24 44z"/>
                    <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.4-2.5 4.5-4.7 5.9l6.2 5.2C40.5 35.7 44 30.3 44 24c0-1.3-.1-2.7-.4-4z"/>
                  </svg>
                  Entrar com Google
                </>
              )}
            </button>

            <p className="card-footer">Apenas colaboradores @laboratoriosobral.com.br</p>
          </div>
        </div>
      </div>
    </div>
  );
}
