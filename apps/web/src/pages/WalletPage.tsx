import { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';
import { db } from '../db';
import type { WalletItemDto } from '@sbrchecks/shared';

export function WalletPage() {
  const { request } = useApi();
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
    db.wallet.toArray().then(c => { if (c.length) setWallet(c); });
    sync();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="page" style={{ maxWidth: '520px' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Minha Carteira</h1>
          <p className="page-sub mono">{wallet.length} PDV{wallet.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="row">
          <span className="row" style={{ gap: '.4rem', fontSize: '.72rem', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
            <span className={`dot ${online ? 'dot-green' : 'dot-red'}`} />
            {online ? 'online' : 'offline'}
          </span>
          <button className="btn btn-primary" onClick={sync} disabled={!online || syncing}>
            {syncing ? 'Sync…' : 'Sincronizar'}
          </button>
        </div>
      </div>

      {lastSync && (
        <p style={{ fontSize: '.68rem', color: 'var(--text-3)', fontFamily: 'var(--font-mono)', marginBottom: '1rem' }}>
          Última sync {lastSync.toLocaleTimeString()}
        </p>
      )}

      {wallet.length === 0 && !syncing && (
        <p className="empty-state">
          {online ? 'Nenhum PDV na carteira.' : 'Sem cache. Conecte-se para sincronizar.'}
        </p>
      )}

      {wallet.map(pdv => (
        <div key={pdv.id} className="card">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="card__title">{pdv.name}</div>
            {pdv.address && <div className="card__sub" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pdv.address}</div>}
            <div className="row" style={{ marginTop: '.35rem', gap: '.5rem' }}>
              {pdv.latitude == null && <span className="badge badge-orange">sem coords</span>}
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '.62rem', color: 'var(--text-3)' }}>{pdv.radiusM}m</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
