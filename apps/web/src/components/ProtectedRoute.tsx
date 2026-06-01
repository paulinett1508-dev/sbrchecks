import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import type { Role } from '@sbrchecks/shared';

const ROLE_RANK: Record<Role, number> = { GDD: 0, GERENTE: 1, ADMIN: 2 };

interface Props {
  children: ReactNode;
  minRole?: Role;
}

export function ProtectedRoute({ children, minRole }: Props) {
  const { accessToken, user } = useAuth();
  if (!accessToken) return <Navigate to="/login" replace />;
  if (minRole && user && ROLE_RANK[user.role] < ROLE_RANK[minRole]) {
    return <Navigate to="/unauthorized" replace />;
  }
  return <>{children}</>;
}
