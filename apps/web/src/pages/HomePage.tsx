import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { Role } from '@sbrchecks/shared';

interface Card { label: string; path: string; desc: string; roles: Role[] }

const CARDS: Card[] = [
  { label: 'Minha Carteira', path: '/wallet',          desc: 'PDVs do dia · sync offline',       roles: ['GDD'] },
  { label: 'PDVs',           path: '/admin/pdvs',       desc: 'Cadastro e edição de PDVs',        roles: ['GERENTE', 'ADMIN'] },
  { label: 'Carteira',       path: '/admin/carteira',   desc: 'Atribuição de PDVs aos GDDs',      roles: ['GERENTE', 'ADMIN'] },
  { label: 'Usuários',       path: '/admin/usuarios',   desc: 'Pré-cadastro e gestão de acessos', roles: ['ADMIN'] },
];

export function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;

  const visible = CARDS.filter(c => c.roles.includes(user.role as Role));

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Início</h1>
          <p className="page-sub">Olá, {user.name}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))', gap: '1rem' }}>
        {visible.map(card => (
          <button
            key={card.path}
            onClick={() => navigate(card.path)}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r)',
              padding: '1.25rem',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'border-color .15s, background .15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--surface-2)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface)'; }}
          >
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: '.95rem', fontWeight: 700, color: 'var(--text)', marginBottom: '.35rem', letterSpacing: '-.015em' }}>
              {card.label}
            </div>
            <div style={{ fontSize: '.75rem', color: 'var(--text-3)' }}>{card.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
