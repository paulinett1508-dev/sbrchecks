import { useAuth } from '../hooks/useAuth';

const MESSAGES: Record<string, string> = {
  GDD: 'Sua rota do dia aparecerá aqui — Sprint 2',
  GERENTE: 'Painel do gerente — Sprint 5',
  ADMIN: 'Painel do gerente — Sprint 5',
};

export function HomePage() {
  const { user, logout } = useAuth();
  if (!user) return null;
  return (
    <main style={{ fontFamily: 'sans-serif', padding: '2rem', background: '#0f172a', minHeight: '100vh', color: '#fff' }}>
      <h1 style={{ marginBottom: '0.5rem' }}>SBRChecks</h1>
      <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>
        Olá, <strong>{user.name}</strong> — papel:{' '}
        <span style={{ color: '#e76327' }}>{user.role}</span>
      </p>
      <p style={{ color: '#64748b', marginBottom: '2rem' }}>{MESSAGES[user.role]}</p>
      <button
        onClick={logout}
        style={{ padding: '0.5rem 1rem', background: '#e76327', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
      >
        Sair
      </button>
    </main>
  );
}
