import { getToken } from './credentials.js';
import { ApiError, ERRORS } from '../domain/errors.js';
import { DEFAULT_API_URL, FETCH_TIMEOUT, AUTH_TIMEOUT } from '../domain/constants.js';
import type { AuthVerification } from '../domain/types.js';

const API_URL = process.env.CMPLX_API_URL || DEFAULT_API_URL;

export function getApiUrl(): string {
  return API_URL;
}

export async function request<T>(
  path: string,
  opts?: { method?: string; body?: unknown; token?: string },
): Promise<T> {
  const token = opts?.token ?? getToken();
  if (!token) {
    throw new ApiError(401, ERRORS.NOT_AUTHENTICATED);
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };

  let bodyStr: string | undefined;
  if (opts?.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    bodyStr = JSON.stringify(opts.body);
  }

  const res = await fetch(`${API_URL}${path}`, {
    method: opts?.method ?? 'GET',
    headers,
    body: bodyStr,
    signal: AbortSignal.timeout(FETCH_TIMEOUT),
  });

  if (!res.ok) {
    if (res.status === 401) {
      throw new ApiError(401, ERRORS.NOT_AUTHENTICATED);
    }
    const text = await res.text().catch(() => '');
    let code = `Server error: ${res.status}`;
    try {
      const json = JSON.parse(text);
      if (typeof json.error === 'string') code = json.error.slice(0, 200);
    } catch { /* use default */ }
    throw new ApiError(res.status, code);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export async function publicRequest<T>(
  path: string,
  opts?: { method?: string; body?: unknown },
): Promise<T> {
  const headers: Record<string, string> = {};

  let bodyStr: string | undefined;
  if (opts?.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    bodyStr = JSON.stringify(opts.body);
  }

  const res = await fetch(`${API_URL}${path}`, {
    method: opts?.method ?? 'GET',
    headers,
    body: bodyStr,
    signal: AbortSignal.timeout(FETCH_TIMEOUT),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    let code = `Server error: ${res.status}`;
    try {
      const json = JSON.parse(text);
      if (typeof json.error === 'string') code = json.error.slice(0, 200);
    } catch { /* use default */ }
    throw new ApiError(res.status, code);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export async function verifyTokenRequest(token: string): Promise<AuthVerification> {
  const res = await fetch(`${API_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(AUTH_TIMEOUT),
  });

  if (!res.ok) {
    if (res.status === 401) {
      throw new ApiError(401, ERRORS.INVALID_TOKEN);
    }
    throw new ApiError(res.status, `Server error: ${res.status}`);
  }

  const data = await res.json();
  if (!data.user) {
    throw new ApiError(401, ERRORS.INVALID_TOKEN);
  }
  return data as AuthVerification;
}

export async function logoutRequest(token: string): Promise<void> {
  try {
    await fetch(`${API_URL}/api/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(AUTH_TIMEOUT),
    });
  } catch { /* best effort */ }
}
