import { getToken } from './credentials.js';
import { ApiError } from '../domain/errors.js';

const API_URL = process.env.CMPLX_API_URL || 'https://api.0cmplx.com';

export function getApiUrl(): string {
  return API_URL;
}

export async function request<T>(
  path: string,
  opts?: { method?: string; body?: unknown; token?: string },
): Promise<T> {
  const token = opts?.token ?? getToken();
  if (!token) {
    throw new ApiError(401, "Not authenticated. Run '0cmplx auth' to log in.");
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
  });

  if (!res.ok) {
    if (res.status === 401) {
      throw new ApiError(401, "Not authenticated. Run '0cmplx auth' to log in.");
    }
    const text = await res.text().catch(() => '');
    let code = `Server error: ${res.status}`;
    try {
      const json = JSON.parse(text);
      if (json.error) code = json.error;
    } catch { /* use default */ }
    throw new ApiError(res.status, code);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
