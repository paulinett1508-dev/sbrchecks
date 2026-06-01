import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import type { AdminUserDto } from '@sbrchecks/shared';
import { RoleSchema } from '@sbrchecks/shared';

type Role = 'GDD' | 'GERENTE' | 'ADMIN';

const s = {
  page: { padding: '1.5rem', fontFamily: 'sans-serif', background: '#0f172a', minHeight: '100vh', color: '#f1f5f9' } as React.CSSProperties,
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' } as React.CSSProperties,
  btn: { padding: '0.5rem 1rem', background: '#e76327', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem' } as React.CSSProperties,
  btnSm: { padding: '0.3rem 0.65rem', background: '#1e293b', color: '#f1f5f9', border: '1px solid #334155', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' } as React.CSSProperties,
  input: { padding: '0.5rem 0.75rem', background: '#1e293b', color: '#f1f5f9', border: '1px solid #334155', borderRadius: '6px', fontSize: '0.875rem', width: '100%', boxSizing: 'border-box' } as React.CSSProperties,
  select: { padding: '0.5rem 0.75rem', background: '#1e293b', color: '#f1f5f9', border: '1px solid #334155', borderRadius: '6px', fontSize: '0.875rem' } as React.CSSProperties,
  th: { padding: '0.75rem', borderBottom: '1px solid #334155', color: '#94a3b8', fontWeight: 600, textAlign: 'left' } as React.CSSProperties,
  td: { padding: '0.75rem', borderBottom: '1px solid #1e293b' } as React.CSSProperties,
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 } as React.CSSProperties,
  modal: { background: '#1e293b', borderRadius: '10px', padding: '1.5rem', width: '420px', maxWidth: '95vw' } as React.CSSProperties,
};

function badge(color: string, text: string) {
  return <span style={{ padding: '0.15rem 0.5rem', background: color + '22', color, borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>{text}</span>;
}

function userBadge(u: AdminUserDto) {
  if (!u.googleId && !u.active) return badge('#f59e0b', 'pendente');
  if (u.active) return badge('#22c55e', 'ativo');
  return badge('#64748b', 'inativo');
}

export function UserListPage() {
  const { request } = useApi();
  const navigate = useNavigate();
  const [users, setUsers] = useState<AdminUserDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: 'GDD' as Role });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await request('GET', '/users');
    if (res.ok) setUsers(await res.json());
    setLoading(false);
  }, [request]);

  useEffect(() => { load(); }, [load]);

  const createUser = async () => {
    setSaving(true);
    const res = await request('POST', '/users', form);
    if (res.ok) { setModal(false); setForm({ name: '', email: '', role: 'GDD' }); load(); }
    else {
      const err = await res.json().catch(() => ({}));
      alert(err.error ?? 'Erro ao criar usuário');
    }
    setSaving(false);
  };

  const changeRole = async (id: string, role: Role) => {
    await request('PATCH', `/users/${id}`, { role });
    load();
  };

  const toggleActive = async (u: AdminUserDto) => {
    await request('PATCH', `/users/${u.id}`, { active: !u.active });
    load();
  };

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => navigate('/')} style={{ ...s.btnSm, fontSize: '1rem' }}>←</button>
          <h1 style={{ margin: 0, fontSize: '1.4rem' }}>Usuários</h1>
        </div>
        <button onClick={() => setModal(true)} style={s.btn}>+ Usuário</button>
      </div>

      {loading ? (
        <p style={{ color: '#64748b' }}>Carregando…</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead style={{ background: '#1e293b' }}>
              <tr>{['Nome', 'Email', 'Papel', 'Status', 'Ações'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td style={s.td}>{u.name}</td>
                  <td style={{ ...s.td, color: '#94a3b8' }}>{u.email}</td>
                  <td style={s.td}>
                    <select
                      value={u.role}
                      onChange={e => changeRole(u.id, e.target.value as Role)}
                      style={s.select}
                    >
                      {RoleSchema.options.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td style={s.td}>{userBadge(u)}</td>
                  <td style={s.td}>
                    <button
                      onClick={() => toggleActive(u)}
                      style={{ ...s.btnSm, borderColor: u.active ? '#64748b' : '#22c55e', color: u.active ? '#64748b' : '#22c55e' }}
                    >
                      {u.active ? 'Desativar' : 'Reativar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <h2 style={{ margin: '0 0 1.25rem', fontSize: '1.1rem' }}>Pré-cadastrar Usuário</h2>
            {([['Nome *', 'name', 'text'], ['Email *', 'email', 'email']] as const).map(([label, key, type]) => (
              <div key={key} style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.3rem' }}>{label}</label>
                <input
                  type={type}
                  style={s.input}
                  value={form[key]}
                  onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                />
              </div>
            ))}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.3rem' }}>Papel</label>
              <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value as Role }))} style={{ ...s.select, width: '100%' }}>
                {RoleSchema.options.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button onClick={() => setModal(false)} style={s.btnSm}>Cancelar</button>
              <button onClick={createUser} disabled={saving || !form.name || !form.email} style={s.btn}>{saving ? 'Salvando…' : 'Criar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
