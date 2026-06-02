import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';
import type { Role } from '@sbrchecks/shared';

interface Stats {
  pdvs: { total: number; active: number; noCoords: number };
  users: { total: number; active: number; pending: number };
}

function StatCard({ value, label, sub, accent }: { value: number | string; label: string; sub?: string; accent?: boolean }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: `1px solid ${accent ? 'var(--accent)' : 'var(--border)'}`,
      borderRadius: 'var(--r)',
      padding: '1.1rem 1.25rem',
    }}>
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '1.75rem',
        fontWeight: 500,
        color: accent ? 'var(--accent)' : 'var(--text)',
        lineHeight: 1,
        marginBottom: '.4rem',
      }}>
        {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
      </div>
      <div style={{ fontSize: '.82rem', color: 'var(--text-2)', fontWeight: 500 }}>{label}</div>
      {sub && <div style={{ fontSize: '.72rem', color: 'var(--text-3)', marginTop: '.2rem', fontFamily: 'var(--font-mono)' }}>{sub}</div>}
    </div>
  );
}

function ManagerDashboard() {
  const { request } = useApi();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    request('GET', '/stats').then(r => r.ok ? r.json() : null).then(setStats);
  }, [request]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-sub">Visão geral da operação</p>
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <p style={{ fontSize: '.72rem', color: 'var(--text-3)', fontFamily: 'var(--font-mono)', marginBottom: '.75rem', letterSpacing: '.04em', textTransform: 'uppercase' }}>PDVs</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px,1fr))', gap: '.75rem' }}>
          <StatCard value={stats?.pdvs.total ?? '—'} label="Total de PDVs" />
          <StatCard value={stats?.pdvs.active ?? '—'} label="PDVs ativos" />
          <StatCard value={stats?.pdvs.noCoords ?? '—'} label="Sem coordenadas" accent={!!stats && stats.pdvs.noCoords > 0} sub="aguardando geocodificação" />
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <p style={{ fontSize: '.72rem', color: 'var(--text-3)', fontFamily: 'var(--font-mono)', marginBottom: '.75rem', letterSpacing: '.04em', textTransform: 'uppercase' }}>Usuários</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px,1fr))', gap: '.75rem' }}>
          <StatCard value={stats?.users.total ?? '—'} label="Total de usuários" />
          <StatCard value={stats?.users.active ?? '—'} label="Ativos" />
          <StatCard value={stats?.users.pending ?? '—'} label="Pendentes de login" accent={!!stats && stats.users.pending > 0} sub="cadastrados, nunca logaram" />
        </div>
      </div>

      <p style={{ fontSize: '.72rem', color: 'var(--text-3)', fontFamily: 'var(--font-mono)', marginBottom: '.75rem', letterSpacing: '.04em', textTransform: 'uppercase' }}>Acesso rápido</p>
      <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
        {[
          { label: 'PDVs sem coords', path: '/admin/pdvs', hint: 'Filtrar e geocodificar' },
          { label: 'Carteira', path: '/admin/carteira', hint: 'Atribuir PDVs a GDDs' },
          { label: 'Usuários', path: '/admin/usuarios', hint: 'Pré-cadastro e papéis' },
        ].map(item => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r)',
              padding: '.75rem 1rem',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'border-color .15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-2)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            <div style={{ fontSize: '.875rem', fontWeight: 500, color: 'var(--text)', marginBottom: '.2rem' }}>{item.label}</div>
            <div style={{ fontSize: '.75rem', color: 'var(--text-3)' }}>{item.hint}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function GddHome() {
  const navigate = useNavigate();
  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Início</h1>
      </div>
      <button
        onClick={() => navigate('/wallet')}
        style={{
          display: 'block', width: '100%', maxWidth: '320px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r)',
          padding: '1.25rem',
          cursor: 'pointer', textAlign: 'left',
          transition: 'border-color .15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
      >
        <div style={{ fontSize: '.95rem', fontWeight: 600, color: 'var(--text)', marginBottom: '.3rem' }}>Minha Carteira</div>
        <div style={{ fontSize: '.78rem', color: 'var(--text-3)' }}>PDVs do dia · sync offline</div>
      </button>
    </div>
  );
}

export function HomePage() {
  const { user } = useAuth();
  if (!user) return null;
  const role = user.role as Role;
  return role === 'GDD' ? <GddHome /> : <ManagerDashboard />;
}
