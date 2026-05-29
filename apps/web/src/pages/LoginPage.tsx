import { useGoogleLogin } from '@react-oauth/google';
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

  const handleGoogle = useGoogleLogin({
    onSuccess: async ({ access_token }) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API}/auth/google`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken: access_token }),
        });
        if (res.status === 403) { navigate('/unauthorized'); return; }
        if (!res.ok) { setError('Falha ao autenticar. Tente novamente.'); return; }
        const raw = await res.json();
        const parsed = UserDto.safeParse((raw as { user: unknown }).user);
        if (!parsed.success) { setError('Resposta inesperada do servidor.'); return; }
        login((raw as { accessToken: string }).accessToken, parsed.data);
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
      {/* Fundo + overlay warm */}
      <img src="/bg_login.png" alt="" className="login-left-bg" />
      <div className="login-overlay" />

      {/* Decorações */}
      <div className="login-deco-corner-tl" />
      <div className="login-deco-corner-tr" />
      <div className="login-deco-corner-bl" />
      <div className="login-deco-corner-br" />
      <div className="login-deco-circle" />
      <svg className="login-deco-lines" viewBox="0 0 1440 900"
        xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
        <line x1="0" y1="300" x2="300" y2="0" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
        <line x1="0" y1="600" x2="600" y2="0" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
        <line x1="100" y1="900" x2="900" y2="100" stroke="rgba(255,255,255,0.035)" strokeWidth="1" />
      </svg>

      {/* Marca esquerda — estilo Nexus */}
      <div className="login-left">
        <div className="brand-icon-row">
          {/* ícone: mapa com pin (visita PDV) */}
          <div className="brand-icon">
            <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 2C10.13 2 7 5.13 7 9c0 5.25 7 15 7 15s7-9.75 7-15c0-3.87-3.13-7-7-7z"
                fill="rgba(255,255,255,0.85)" />
              <circle cx="14" cy="9" r="2.5" fill="rgba(231,99,39,1)" />
            </svg>
          </div>
          <span className="brand-sep">/</span>
          {/* ícone: checklist (check-in) */}
          <div className="brand-icon">
            <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="5" y="4" width="18" height="20" rx="3"
                fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" />
              <line x1="9" y1="10" x2="19" y2="10" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
              <line x1="9" y1="14" x2="19" y2="14" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
              <path d="M9 18.5l2.5 2L16 16" stroke="rgba(231,99,39,1)" strokeWidth="1.8"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
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
            <p className="subtitle">Gestão de Visitas · Laboratório Sobral</p>
            <div className="card-divider" />

            {error && <p className="login-error">{error}</p>}

            <button
              className="btn-entrar"
              onClick={() => handleGoogle()}
              disabled={loading}
            >
              {loading ? 'Autenticando…' : 'Entrar com Google'}
            </button>

            <p className="card-footer">Apenas colaboradores @laboratoriosobral.com.br</p>
          </div>
        </div>
      </div>
    </div>
  );
}
