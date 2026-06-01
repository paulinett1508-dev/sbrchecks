import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import type { PdvDto } from '@sbrchecks/shared';

type PageData = { data: PdvDto[]; total: number; page: number; pageSize: number };
type FormState = { name: string; address: string; document: string; latitude: string; longitude: string; radiusM: string };

const EMPTY: FormState = { name: '', address: '', document: '', latitude: '', longitude: '', radiusM: '120' };

const s = {
  page: { padding: '1.5rem', fontFamily: 'sans-serif', background: '#0f172a', minHeight: '100vh', color: '#f1f5f9' } as React.CSSProperties,
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' } as React.CSSProperties,
  btn: { padding: '0.5rem 1rem', background: '#e76327', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem' } as React.CSSProperties,
  btnSm: { padding: '0.3rem 0.65rem', background: '#1e293b', color: '#f1f5f9', border: '1px solid #334155', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' } as React.CSSProperties,
  input: { padding: '0.5rem 0.75rem', background: '#1e293b', color: '#f1f5f9', border: '1px solid #334155', borderRadius: '6px', fontSize: '0.875rem', width: '100%', boxSizing: 'border-box' } as React.CSSProperties,
  th: { padding: '0.75rem', borderBottom: '1px solid #334155', color: '#94a3b8', fontWeight: 600, textAlign: 'left' } as React.CSSProperties,
  td: { padding: '0.75rem', borderBottom: '1px solid #1e293b' } as React.CSSProperties,
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 } as React.CSSProperties,
  modal: { background: '#1e293b', borderRadius: '10px', padding: '1.5rem', width: '480px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' } as React.CSSProperties,
};

function badge(color: string, text: string) {
  return <span style={{ padding: '0.15rem 0.5rem', background: color + '22', color, borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>{text}</span>;
}

export function PdvListPage() {
  const { request } = useApi();
  const navigate = useNavigate();
  const [data, setData] = useState<PageData>({ data: [], total: 0, page: 1, pageSize: 20 });
  const [loading, setLoading] = useState(false);
  const [noCoords, setNoCoords] = useState(false);
  const [q, setQ] = useState('');
  const [modal, setModal] = useState<{ open: boolean; id?: string }>({ open: false });
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: '20' });
    if (noCoords) params.set('noCoords', 'true');
    if (q) params.set('q', q);
    const res = await request('GET', `/pdvs?${params}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, [request, noCoords, q]);

  useEffect(() => { load(1); }, [load]);

  const openCreate = () => { setForm(EMPTY); setModal({ open: true }); };
  const openEdit = (pdv: PdvDto) => {
    setForm({
      name: pdv.name,
      address: pdv.address ?? '',
      document: pdv.document ?? '',
      latitude: pdv.latitude != null ? String(pdv.latitude) : '',
      longitude: pdv.longitude != null ? String(pdv.longitude) : '',
      radiusM: String(pdv.radiusM),
    });
    setModal({ open: true, id: pdv.id });
  };

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const body = {
      name: form.name.trim(),
      address: form.address || undefined,
      document: form.document || undefined,
      latitude: form.latitude ? Number(form.latitude) : undefined,
      longitude: form.longitude ? Number(form.longitude) : undefined,
      radiusM: form.radiusM ? Number(form.radiusM) : undefined,
    };
    const res = modal.id
      ? await request('PATCH', `/pdvs/${modal.id}`, body)
      : await request('POST', '/pdvs', body);
    if (res.ok) { setModal({ open: false }); load(data.page); }
    setSaving(false);
  };

  const toggleActive = async (pdv: PdvDto) => {
    await request('PATCH', `/pdvs/${pdv.id}`, { active: !pdv.active });
    load(data.page);
  };

  const field = (label: string, key: keyof FormState) => (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.3rem' }}>{label}</label>
      <input
        style={s.input}
        value={form[key]}
        onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
      />
    </div>
  );

  const totalPages = Math.ceil(data.total / data.pageSize);

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => navigate('/')} style={{ ...s.btnSm, fontSize: '1rem' }}>←</button>
          <h1 style={{ margin: 0, fontSize: '1.4rem' }}>PDVs <span style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 400 }}>({data.total})</span></h1>
        </div>
        <button onClick={openCreate} style={s.btn}>+ PDV</button>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          placeholder="Buscar por nome…"
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && load(1)}
          style={{ ...s.input, width: '260px' }}
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', cursor: 'pointer', fontSize: '0.875rem' }}>
          <input type="checkbox" checked={noCoords} onChange={e => setNoCoords(e.target.checked)} />
          Sem coordenadas
        </label>
      </div>

      {loading ? (
        <p style={{ color: '#64748b' }}>Carregando…</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead style={{ background: '#1e293b' }}>
              <tr>{['Nome', 'Endereço', 'Raio', 'Coords', 'Status', 'Ações'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {data.data.map(pdv => (
                <tr key={pdv.id}>
                  <td style={s.td}>{pdv.name}</td>
                  <td style={{ ...s.td, color: '#94a3b8', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pdv.address ?? '—'}</td>
                  <td style={s.td}>{pdv.radiusM}m</td>
                  <td style={s.td}>{pdv.latitude == null ? badge('#e76327', 'sem coords') : badge('#22c55e', '✓')}</td>
                  <td style={s.td}>{badge(pdv.active ? '#22c55e' : '#64748b', pdv.active ? 'ativo' : 'inativo')}</td>
                  <td style={{ ...s.td, display: 'flex', gap: '0.4rem' }}>
                    <button onClick={() => openEdit(pdv)} style={s.btnSm}>Editar</button>
                    <button onClick={() => toggleActive(pdv)} style={{ ...s.btnSm, borderColor: pdv.active ? '#64748b' : '#e76327', color: pdv.active ? '#64748b' : '#e76327' }}>
                      {pdv.active ? 'Desativar' : 'Ativar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', alignItems: 'center', fontSize: '0.875rem', color: '#94a3b8' }}>
          <button disabled={data.page <= 1} onClick={() => load(data.page - 1)} style={s.btnSm}>← Ant</button>
          <span>Pág {data.page} de {totalPages}</span>
          <button disabled={data.page >= totalPages} onClick={() => load(data.page + 1)} style={s.btnSm}>Próx →</button>
        </div>
      )}

      {modal.open && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <h2 style={{ margin: '0 0 1.25rem', fontSize: '1.1rem' }}>{modal.id ? 'Editar PDV' : 'Novo PDV'}</h2>
            {field('Nome *', 'name')}
            {field('Endereço', 'address')}
            {field('CNPJ', 'document')}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>{field('Latitude', 'latitude')}</div>
              <div>{field('Longitude', 'longitude')}</div>
            </div>
            {field('Raio (m)', 'radiusM')}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button onClick={() => setModal({ open: false })} style={s.btnSm}>Cancelar</button>
              <button onClick={save} disabled={saving || !form.name.trim()} style={s.btn}>{saving ? 'Salvando…' : 'Salvar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
