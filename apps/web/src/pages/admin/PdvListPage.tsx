import { useEffect, useState, useCallback } from 'react';
import { useApi } from '../../hooks/useApi';
import type { PdvDto } from '@sbrchecks/shared';

type PageData = { data: PdvDto[]; total: number; page: number; pageSize: number };
type Form = { name: string; address: string; document: string; latitude: string; longitude: string; radiusM: string };

const EMPTY: Form = { name: '', address: '', document: '', latitude: '', longitude: '', radiusM: '120' };

export function PdvListPage() {
  const { request } = useApi();
  const [data, setData] = useState<PageData>({ data: [], total: 0, page: 1, pageSize: 20 });
  const [loading, setLoading] = useState(false);
  const [noCoords, setNoCoords] = useState(false);
  const [q, setQ] = useState('');
  const [modal, setModal] = useState<{ open: boolean; id?: string }>({ open: false });
  const [form, setForm] = useState<Form>(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    const p = new URLSearchParams({ page: String(page), pageSize: '20' });
    if (noCoords) p.set('noCoords', 'true');
    if (q) p.set('q', q);
    const res = await request('GET', `/pdvs?${p}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, [request, noCoords, q]);

  useEffect(() => { load(1); }, [load]);

  const openCreate = () => { setForm(EMPTY); setModal({ open: true }); };
  const openEdit = (pdv: PdvDto) => {
    setForm({
      name: pdv.name, address: pdv.address ?? '', document: pdv.document ?? '',
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

  const totalPages = Math.ceil(data.total / data.pageSize);

  const field = (label: string, key: keyof Form, type = 'text') => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input className="input" type={type} value={form[key]}
        onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} />
    </div>
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">PDVs</h1>
          <p className="page-sub mono">{data.total} pontos de venda</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Novo PDV</button>
      </div>

      <div className="filter-bar">
        <input
          className="input" style={{ width: '240px' }}
          placeholder="Buscar por nome…"
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && load(1)}
        />
        <label className="row" style={{ gap: '.5rem', fontSize: '.78rem', color: 'var(--text-2)', cursor: 'pointer' }}>
          <input type="checkbox" checked={noCoords} onChange={e => setNoCoords(e.target.checked)} />
          Sem coordenadas
        </label>
      </div>

      {loading ? (
        <p className="empty-state">Carregando…</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Endereço</th>
                <th>Raio</th>
                <th>Coords</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.data.map(pdv => (
                <tr key={pdv.id}>
                  <td style={{ fontWeight: 500 }}>{pdv.name}</td>
                  <td className="text-muted" style={{ maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {pdv.address ?? '—'}
                  </td>
                  <td><span className="mono" style={{ fontSize: '.78rem' }}>{pdv.radiusM}m</span></td>
                  <td>
                    {pdv.latitude == null
                      ? <span className="badge badge-orange">sem coords</span>
                      : <span className="badge badge-green">✓ ok</span>}
                  </td>
                  <td>
                    <span className={`badge ${pdv.active ? 'badge-green' : 'badge-gray'}`}>
                      {pdv.active ? 'ativo' : 'inativo'}
                    </span>
                  </td>
                  <td>
                    <div className="row" style={{ justifyContent: 'flex-end' }}>
                      <button className="btn btn-ghost" onClick={() => openEdit(pdv)}>Editar</button>
                      <button
                        className={`btn ${pdv.active ? 'btn-ghost' : 'btn-success'}`}
                        onClick={() => toggleActive(pdv)}
                      >
                        {pdv.active ? 'Desativar' : 'Ativar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button className="btn btn-ghost" disabled={data.page <= 1} onClick={() => load(data.page - 1)}>← Ant</button>
          <span>Pág {data.page} de {totalPages}</span>
          <button className="btn btn-ghost" disabled={data.page >= totalPages} onClick={() => load(data.page + 1)}>Próx →</button>
        </div>
      )}

      {modal.open && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>{modal.id ? 'Editar PDV' : 'Novo PDV'}</h2>
            {field('Nome *', 'name')}
            {field('Endereço', 'address')}
            {field('CNPJ', 'document')}
            <div className="grid-2">
              {field('Latitude', 'latitude', 'number')}
              {field('Longitude', 'longitude', 'number')}
            </div>
            {field('Raio (m)', 'radiusM', 'number')}
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModal({ open: false })}>Cancelar</button>
              <button className="btn btn-primary" onClick={save} disabled={saving || !form.name.trim()}>
                {saving ? 'Salvando…' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
