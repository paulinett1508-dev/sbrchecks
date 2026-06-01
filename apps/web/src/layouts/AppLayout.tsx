import { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { Role } from '@sbrchecks/shared';

const RANK: Record<Role, number> = { GDD: 0, GERENTE: 1, ADMIN: 2 };
const hasRole = (u: Role, min: Role) => RANK[u] >= RANK[min];

/* ── SVG icons ── */
const Ico = {
  home:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  wallet:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  pdv:      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  list:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  users:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  logout:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  menu:     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
};

function NavItem({ to, icon, label, end }: { to: string; icon: React.ReactNode; label: string; end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
    >
      {icon}
      {label}
    </NavLink>
  );
}

export function AppLayout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => setOpen(false), [pathname]);

  if (!user) return null;
  const role = user.role as Role;

  return (
    <div className="app-shell">
      {/* Mobile header */}
      <header className="mobile-header">
        <div className="mobile-header__logo">SBR<span>CHECKS</span></div>
        <button className="hamburger" onClick={() => setOpen(o => !o)}>{Ico.menu}</button>
      </header>

      {/* Overlay */}
      {open && <div className="sidebar-overlay" onClick={() => setOpen(false)} />}

      {/* Sidebar */}
      <aside className={`sidebar${open ? ' sidebar--open' : ''}`}>
        <div className="sidebar__logo">
          <div className="sidebar__logo-mark">SBR<span>CHECKS</span></div>
          <div className="sidebar__logo-sub">Laboratório Sobral</div>
        </div>

        <nav className="sidebar__nav">
          <NavItem to="/" icon={Ico.home} label="Início" end />

          {role === 'GDD' && (
            <NavItem to="/wallet" icon={Ico.wallet} label="Minha Carteira" />
          )}

          {hasRole(role, 'GERENTE') && (
            <>
              <div className="sidebar__section-label">Gestão</div>
              <NavItem to="/admin/pdvs" icon={Ico.pdv} label="PDVs" />
              <NavItem to="/admin/carteira" icon={Ico.list} label="Carteira" />
            </>
          )}

          {role === 'ADMIN' && (
            <NavItem to="/admin/usuarios" icon={Ico.users} label="Usuários" />
          )}
        </nav>

        <div className="sidebar__user">
          <div className="sidebar__user-name">{user.name}</div>
          <div className="sidebar__user-role">{user.role}</div>
          <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }} onClick={logout}>
            {Ico.logout} Sair
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
