import { request, getApiUrl } from '../infrastructure/api.js';
import { saveCredentials, loadCredentials, clearCredentials } from '../infrastructure/credentials.js';
import type { AuthVerification, Credentials } from '../domain/types.js';

export async function verifyToken(token: string): Promise<AuthVerification> {
  const API_URL = getApiUrl();
  const res = await fetch(`${API_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(res.status === 401 ? 'Invalid token' : `Server error: ${res.status}`);
  }

  const data = await res.json();
  if (!data.user) throw new Error('Invalid token');
  return data;
}

export async function login(token: string): Promise<Credentials> {
  const result = await verifyToken(token);

  const creds: Credentials = {
    token,
    login: result.user.login,
    tier: result.user.tier,
    scopes: result.scopes,
    savedAt: new Date().toISOString(),
  };

  saveCredentials(creds);
  return creds;
}

export async function logout(): Promise<void> {
  const creds = loadCredentials();
  if (!creds) return;

  const API_URL = getApiUrl();
  try {
    await fetch(`${API_URL}/api/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${creds.token}` },
    });
  } catch { /* best effort */ }

  clearCredentials();
}

export function getStatus(): Credentials | null {
  return loadCredentials();
}
