import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { UserDto } from '@sbrchecks/shared';

interface AuthState {
  accessToken: string | null;
  user: UserDto | null;
}

interface AuthContextValue extends AuthState {
  login: (token: string, user: UserDto) => void;
  logout: () => Promise<void>;
  refreshAccess: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    accessToken: null,
    user: null,
  });

  const login = useCallback((token: string, user: UserDto) => {
    setState({ accessToken: token, user });
  }, []);

  const logout = useCallback(async () => {
    await fetch(`${API}/auth/logout`, { method: 'POST', credentials: 'include' });
    setState({ accessToken: null, user: null });
  }, []);

  const refreshAccess = useCallback(async (): Promise<string | null> => {
    try {
      const res = await fetch(`${API}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { accessToken: string };
      setState((s) => ({ ...s, accessToken: data.accessToken }));
      return data.accessToken;
    } catch {
      return null;
    }
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, refreshAccess }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
