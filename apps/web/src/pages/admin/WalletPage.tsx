import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import type { AdminUserDto, WalletItemDto } from '@sbrchecks/shared';

type PdvResult = { data: WalletItemDto[]; total: number };

const s = {
  page: { padding: '1.5rem', fontFamily: 'sans-serif', background: '#0f172a', minHeight: '100vh', color: '#f1f5f9' } as React.CSSProperties,
  header: { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' } as React.CSSProperties,
  btn: { padding: '0.5rem 1rem', background: '#e76327', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem' } as React.CSSProperties,
  btnSm: { padding: '0.3rem 0.65rem', background: '#1e293b', color: '#f1f5f9', border: '1px solid #334155', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' } as React.CSSProperties,
  input: { padding: '0.5rem 0.75rem', background: '#1e293b', color: '#f1f5f9', border: '1px solid #334155', borderRadius: '6px', fontSize: '0.875rem', width: '100%', boxSizing: 'border-box' } as React.CSSProperties,
  select: { padding: '0.5rem 0.75rem', background: '#1e293b', color: '#f1f5f9', border: '1px solid #334155', borderRadius: '6px', fontSize: '0.875rem', minWidth: '240px' } as React.CSSProperties,
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 } as React.CSSProperties,
  modal: { background: '#1e293b', borderRadius: '10px', padding: '1.5rem', width: '520px', maxWidth: '95vw', maxHeight: '85vh', display: 'flex', flexDirection: 'column' } as React.CSSProperties,
  card: { background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' } as React.CSSProperties,
};

function badge(color: string, text: string) {
  return <span style={{ padding: '0.15rem 0.5rem', background: color + '22', color, borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>{text}</span>;
}

export function AdminWalletPage() {
  const { request } = useApi();
  const navigate = useNavigate();
  const [gdds, setGdds] = useState<AdminUserDto[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [wallet, setWallet] = useState<WalletItemDto[]>([]);
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [modal, setModal] = useState(false);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<WalletItemDto[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    request('GET', '/users').then(r => r.ok ? r.json() : []).then((users: AdminUserDto[]) => {
      setGdds(users.filter(u => u.role === 'GDD' && u.active));
    });
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
    const params = new URLSearchParams({ pageSize: '30' });
    if (q) params.set('q', q);
    const res = await request('GET', `/pdvs?${params}`);
    if (res.ok) {
      const data: { data: WalletItemDto[] } = await res.json();
      setResults(data.data);
    }
    setSearching(false);
  }, [request]);

  const openModal = () => { setSearch(''); setResults([]); setModal(true); searchPdvs(''); };

  const assign = async (pdvId: string) => {
    await request('POST', `/users/${selectedId}/wallet`, { pdvId });
    loadWallet(selectedId);
  };

  const walletIds = new Set(wallet.map(p => p.id));
  const selectedGdd = gdds.find(g => g.id === selectedId);

  return (
    <div style={s.page}>
      <div style={s.header}>
        <button onClick={() => navigate('/')} style={{ ...s.btnSm, fontSize: '1rem' }}>←</button>
        <h1 style={{ margin: 0, fontSize: '1.4rem' }}>Carteira</h1>
      </div>

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <select value={selectedId} onChange={e => setSelectedId(e.target.value)} style={s.select}>
          <option value="">— Selecione um GDD —</option>
          {gdds.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        {selectedId && (
          <button onClick={openModal} style={s.btn}>+ Adicionar PDV</button>
        )}
        {selectedId && (
          <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>{wallet.length} PDV{wallet.length !== 1 ? 's' : ''} na carteira</span>
        )}
      </div>

      {!selectedId && <p style={{ color: '#64748b' }}>Selecione um GDD para gerenciar a carteira.</p>}

      {selectedId && loadingWallet && <p style={{ color: '#64748b' }}>Carregando…</p>}

      {selectedId && !loadingWallet && (
        wallet.length === 0
          ? <p style={{ color: '#64748b' }}>Nenhum PDV na carteira de {selectedGdd?.name}.</p>
          : wallet.map(pdv => (
            <div key={pdv.id} style={s.card}>
              <div>
                <div style={{ fontWeight: 500 }}>{pdv.name}</div>
                {pdv.address && <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.2rem' }}>{pdv.address}</div>}
                {pdv.latitude == null && <span style={{ marginTop: '0.3rem', display: 'inline-block' }}>{badge('#e76327', 'sem coords')}</span>}
              </div>
              <button onClick={() => remove(pdv.id)} style={{ ...s.btnSm, color: '#ef4444', borderColor: '#ef4444' }}>Remover</button>
            </div>
          ))
      )}

      {modal && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem' }}>Adicionar PDV à carteira</h2>
            <input
              placeholder="Buscar PDV…"
              value={search}
              style={s.input}
              onChange={e => { setSearch(e.target.value); searchPdvs(e.target.value); }}
            />
            <div style={{ marginTop: '0.75rem', overflowY: 'auto', flex: 1 }}>
              {searching && <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Buscando…</p>}
              {results.map(pdv => (
                <div key={pdv.id} style={{ ...s.card, marginBottom: '0.4rem' }}>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{pdv.name}</div>
                    {pdv.address && <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{pdv.address}</div>}
                  </div>
                  {walletIds.has(pdv.id)
                    ? badge('#64748b', 'na carteira')
                    : <button onClick={() => assign(pdv.id)} style={s.btn}>Adicionar</button>}
                </div>
              ))}
            </div>
            <button onClick={() => setModal(false)} style={{ ...s.btnSm, marginTop: '1rem', alignSelf: 'flex-end' }}>Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
}
