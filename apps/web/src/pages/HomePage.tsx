import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { Role } from '@sbrchecks/shared';

interface NavItem {
  label: string;
  path: string;
  roles: Role[];
  desc: string;
}

const NAV: NavItem[] = [
  { label: 'Minha Carteira', path: '/wallet', roles: ['GDD'], desc: 'PDVs do dia, sync offline' },
  { label: 'PDVs', path: '/admin/pdvs', roles: ['GERENTE', 'ADMIN'], desc: 'Cadastro e edição de PDVs' },
  { label: 'Carteira', path: '/admin/carteira', roles: ['GERENTE', 'ADMIN'], desc: 'Atribuição de PDVs aos GDDs' },
  { label: 'Usuários', path: '/admin/usuarios', roles: ['ADMIN'], desc: 'Pré-cadastro e gestão de acessos' },
];

export function HomePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;

  const visible = NAV.filter(item => item.roles.includes(user.role));

  return (
    <main style={{ fontFamily: 'sans-serif', padding: '2rem', background: '#0f172a', minHeight: '100vh', color: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.6rem' }}>SBR<span style={{ color: '#e76327' }}>Checks</span></h1>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>
            Olá, <strong style={{ color: '#f1f5f9' }}>{user.name}</strong>
            {' '}·{' '}
            <span style={{ color: '#e76327' }}>{user.role}</span>
          </p>
        </div>
        <button
          onClick={logout}
          style={{ padding: '0.4rem 0.9rem', background: 'transparent', color: '#64748b', border: '1px solid #334155', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
        >
          Sair
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
        {visible.map(item => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            style={{
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '10px',
              padding: '1.25rem',
              color: '#f1f5f9',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#e76327')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = '#334155')}
          >
            <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.4rem' }}>{item.label}</div>
            <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{item.desc}</div>
          </button>
        ))}
      </div>
    </main>
  );
}
