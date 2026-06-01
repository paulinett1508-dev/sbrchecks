import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { db } from '../db';
import type { WalletItemDto } from '@sbrchecks/shared';

function badge(color: string, text: string) {
  return <span style={{ padding: '0.15rem 0.5rem', background: color + '22', color, borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>{text}</span>;
}

export function WalletPage() {
  const { request } = useApi();
  const navigate = useNavigate();
  const [wallet, setWallet] = useState<WalletItemDto[]>([]);
  const [online, setOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  const loadFromCache = async () => {
    const cached = await db.wallet.toArray();
    if (cached.length > 0) setWallet(cached);
  };

  const sync = async () => {
    if (!online) return;
    setSyncing(true);
    try {
      const res = await request('GET', '/me/wallet');
      if (res.ok) {
        const data: WalletItemDto[] = await res.json();
        await db.wallet.clear();
        await db.wallet.bulkPut(data);
        setWallet(data);
        setLastSync(new Date());
      }
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    loadFromCache();
    sync();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ padding: '1rem 1rem 2rem', fontFamily: 'sans-serif', background: '#0f172a', minHeight: '100vh', color: '#f1f5f9', maxWidth: '480px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <button
          onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', color: '#f1f5f9', fontSize: '1.25rem', cursor: 'pointer', padding: '0.25rem' }}
        >←</button>
        <h1 style={{ margin: 0, fontSize: '1.3rem', flex: 1 }}>Minha Carteira</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: online ? '#22c55e' : '#ef4444', display: 'inline-block' }} />
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{online ? 'online' : 'offline'}</span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <span style={{ color: '#64748b', fontSize: '0.8rem' }}>
          {lastSync ? `Sincronizado ${lastSync.toLocaleTimeString()}` : 'Cache local'}
        </span>
        <button
          onClick={sync}
          disabled={!online || syncing}
          style={{ padding: '0.4rem 0.75rem', background: online ? '#e76327' : '#334155', color: '#fff', border: 'none', borderRadius: '6px', cursor: online ? 'pointer' : 'default', fontSize: '0.8rem' }}
        >
          {syncing ? 'Sincronizando…' : 'Sincronizar'}
        </button>
      </div>

      {wallet.length === 0 && !syncing && (
        <p style={{ color: '#64748b', textAlign: 'center', marginTop: '3rem' }}>
          {online ? 'Sem PDVs na carteira.' : 'Sem dados em cache. Conecte à internet para sincronizar.'}
        </p>
      )}

      {wallet.map(pdv => (
        <div key={pdv.id} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '1rem', marginBottom: '0.75rem' }}>
          <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.25rem' }}>{pdv.name}</div>
          {pdv.address && <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.4rem' }}>{pdv.address}</div>}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {pdv.latitude == null && badge('#e76327', 'sem coords')}
            <span style={{ color: '#64748b', fontSize: '0.75rem' }}>raio {pdv.radiusM}m</span>
          </div>
        </div>
      ))}
    </div>
  );
}
