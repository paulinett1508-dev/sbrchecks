import { useEffect, useState, useCallback } from 'react';
import { useApi } from '../../hooks/useApi';
import type { AdminUserDto, WalletItemDto } from '@sbrchecks/shared';

export function AdminWalletPage() {
  const { request } = useApi();
  const [gdds, setGdds] = useState<AdminUserDto[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [wallet, setWallet] = useState<WalletItemDto[]>([]);
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [modal, setModal] = useState(false);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<WalletItemDto[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    request('GET', '/users')
      .then(r => r.ok ? r.json() : [])
      .then((users: AdminUserDto[]) => setGdds(users.filter(u => u.role === 'GDD' && u.active)));
  }, [request]);

  const loadWallet = useCallback(async (id: string) => {
    if (!id) return;
    setLoadingWallet(true);
    const res = await request('GET', `/users/${id}/wallet`);
    if (res.ok) setWallet(await res.json());
    setLoadingWallet(false);
  }, [request]);

  useEffect(() => { loadWallet(selectedId); }, [selectedId, loadWallet]);

  const remove = async (pdvId: string) => {
    await request('DELETE', `/users/${selectedId}/wallet/${pdvId}`);
    loadWallet(selectedId);
  };

  const searchPdvs = useCallback(async (q: string) => {
    setSearching(true);
    const p = new URLSearchParams({ pageSize: '40' });
    if (q) p.set('q', q);
    const res = await request('GET', `/pdvs?${p}`);
    if (res.ok) { const d = await res.json(); setResults(d.data); }
    setSearching(false);
  }, [request]);

  const openModal = () => { setSearch(''); setResults([]); setModal(true); searchPdvs(''); };

  const assign = async (pdvId: string) => {
    await request('POST', `/users/${selectedId}/wallet`, { pdvId });
    loadWallet(selectedId);
  };

  const walletIds = new Set(wallet.map(p => p.id));
  const selected = gdds.find(g => g.id === selectedId);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Carteira</h1>
          <p className="page-sub">Atribuição de PDVs por GDD</p>
        </div>
        {selectedId && (
          <button className="btn btn-primary" onClick={openModal}>+ Adicionar PDV</button>
        )}
      </div>

      <div className="filter-bar" style={{ marginBottom: '1.5rem' }}>
        <select className="select" value={selectedId} onChange={e => setSelectedId(e.target.value)}>
          <option value="">— Selecione um GDD —</option>
          {gdds.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        {selectedId && (
          <span style={{ fontSize: '.78rem', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
            {wallet.length} PDV{wallet.length !== 1 ? 's' : ''} na carteira de {selected?.name}
          </span>
        )}
      </div>

      {!selectedId && <p className="empty-state">Selecione um GDD para gerenciar a carteira.</p>}
      {selectedId && loadingWallet && <p className="empty-state">Carregando…</p>}
      {selectedId && !loadingWallet && wallet.length === 0 && (
        <p className="empty-state">Nenhum PDV na carteira.</p>
      )}

      {wallet.map(pdv => (
        <div key={pdv.id} className="card">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="card__title">{pdv.name}</div>
            {pdv.address && <div className="card__sub" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pdv.address}</div>}
            <div className="row" style={{ marginTop: '.3rem', gap: '.5rem' }}>
              {pdv.latitude == null && <span className="badge badge-orange">sem coords</span>}
              <span className="mono" style={{ fontSize: '.62rem', color: 'var(--text-3)' }}>{pdv.radiusM}m</span>
            </div>
          </div>
          <button className="btn btn-danger" onClick={() => remove(pdv.id)}>Remover</button>
        </div>
      ))}

      {modal && (
        <div className="modal-overlay">
          <div className="modal modal--wide">
            <h2>Adicionar PDV à carteira</h2>
            <div className="form-group">
              <input
                className="input"
                placeholder="Buscar PDV por nome…"
                value={search}
                onChange={e => { setSearch(e.target.value); searchPdvs(e.target.value); }}
              />
            </div>
            <div style={{ overflowY: 'auto', flex: 1, marginBottom: '1rem' }}>
              {searching && <p className="empty-state" style={{ padding: '1rem 0' }}>Buscando…</p>}
              {results.map(pdv => (
                <div key={pdv.id} className="card" style={{ marginBottom: '.4rem' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="card__title" style={{ fontSize: '.85rem' }}>{pdv.name}</div>
                    {pdv.address && <div className="card__sub" style={{ fontSize: '.75rem' }}>{pdv.address}</div>}
                  </div>
                  {walletIds.has(pdv.id)
                    ? <span className="badge badge-gray">na carteira</span>
                    : <button className="btn btn-primary" onClick={() => assign(pdv.id)}>Adicionar</button>}
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModal(false)}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
