import { useEffect, useState, useCallback } from 'react';
import { useApi } from '../../hooks/useApi';
import type { AdminUserDto } from '@sbrchecks/shared';
import { RoleSchema } from '@sbrchecks/shared';

type Role = 'GDD' | 'GERENTE' | 'ADMIN';

function statusBadge(u: AdminUserDto) {
  if (!u.googleId && !u.active) return <span className="badge badge-yellow">pendente</span>;
  if (u.active) return <span className="badge badge-green">ativo</span>;
  return <span className="badge badge-gray">inativo</span>;
}

export function UserListPage() {
  const { request } = useApi();
  const [users, setUsers] = useState<AdminUserDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: 'GDD' as Role });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const res = await request('GET', '/users');
    if (res.ok) setUsers(await res.json());
    setLoading(false);
  }, [request]);

  useEffect(() => { load(); }, [load]);

  const createUser = async () => {
    setSaving(true); setError('');
    const res = await request('POST', '/users', form);
    if (res.ok) {
      setModal(false); setForm({ name: '', email: '', role: 'GDD' }); load();
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? 'Erro ao criar usuário');
    }
    setSaving(false);
  };

  const changeRole = async (id: string, role: Role) => {
    await request('PATCH', `/users/${id}`, { role }); load();
  };

  const toggleActive = async (u: AdminUserDto) => {
    await request('PATCH', `/users/${u.id}`, { active: !u.active }); load();
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Usuários</h1>
          <p className="page-sub mono">{users.length} cadastros</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setError(''); setModal(true); }}>+ Usuário</button>
      </div>

      {loading ? (
        <p className="empty-state">Carregando…</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Email</th>
                <th>Papel</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 500 }}>{u.name}</td>
                  <td className="text-muted mono" style={{ fontSize: '.78rem' }}>{u.email}</td>
                  <td>
                    <select className="select" value={u.role} onChange={e => changeRole(u.id, e.target.value as Role)}>
                      {RoleSchema.options.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td>{statusBadge(u)}</td>
                  <td>
                    <button
                      className={`btn ${u.active ? 'btn-ghost' : 'btn-success'}`}
                      onClick={() => toggleActive(u)}
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
        <div className="modal-overlay">
          <div className="modal">
            <h2>Pré-cadastrar Usuário</h2>
            <div className="form-group">
              <label className="form-label">Nome *</label>
              <input className="input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input className="input" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Papel</label>
              <select className="select" style={{ width: '100%' }} value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value as Role }))}>
                {RoleSchema.options.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            {error && <p style={{ color: 'var(--danger)', fontSize: '.8rem', marginBottom: '.75rem' }}>{error}</p>}
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={createUser} disabled={saving || !form.name || !form.email}>
                {saving ? 'Criando…' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
