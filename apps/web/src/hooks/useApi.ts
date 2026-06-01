import { useCallback } from 'react';
import { useAuth } from './useAuth';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export function useApi() {
  const { accessToken, refreshAccess } = useAuth();

  const request = useCallback(
    async (method: string, path: string, body?: unknown): Promise<Response> => {
      const makeHeaders = (token: string | null): Record<string, string> => ({
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      });

      const init = (token: string | null): RequestInit => ({
        method,
        credentials: 'include',
        headers: makeHeaders(token),
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });

      let res = await fetch(`${API}${path}`, init(accessToken));
      if (res.status === 401) {
        const newToken = await refreshAccess();
        if (newToken) res = await fetch(`${API}${path}`, init(newToken));
      }
      return res;
    },
    [accessToken, refreshAccess]
  );

  return { request };
}
