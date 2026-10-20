const TOKEN_KEY = 'admin_token';
import { API_URL } from '@/lib/apiUrl';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);

//mirrored the token into a cookie for the middleware to read it and validate the session
 document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
  document.cookie = `${TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax`;
}

// Thrown when the backend rate limit is hit (DEFAULT_THROTTLE_RATES['login'])
export class TooManyAttemptsError extends Error {
  constructor(public retryAfterSeconds: number | null) {
    super('Trop de tentatives de connexion.');
  }
}

export async function login(username: string, password: string): Promise<void> {
  const res = await fetch(`${API_URL}/auth/token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (res.status === 429) {
    // DRF puts the wait in the body: "... Expected available in 42 seconds."
    const data = await res.json().catch(() => null);
    const match = typeof data?.detail === 'string' ? data.detail.match(/(\d+)\s*second/) : null;
    throw new TooManyAttemptsError(match ? Number(match[1]) : null);
  }
  if (!res.ok) {
    throw new Error('Identifiants invalides.');
  }
  const data = await res.json();
  setToken(data.token);
}
