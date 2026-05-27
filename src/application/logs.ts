import { request, getApiUrl } from '../infrastructure/api.js';
import { validateId } from '../domain/validation.js';
import type { LogsResponse } from '../domain/types.js';

export async function list(appId: string, type?: string): Promise<LogsResponse> {
  validateId(appId, 'app ID');
  const qs = type ? `?type=${encodeURIComponent(type)}` : '';
  return request<LogsResponse>(`/api/apps/${encodeURIComponent(appId)}/logs${qs}`);
}

export async function clear(appId: string): Promise<void> {
  validateId(appId, 'app ID');
  return request<void>(`/api/apps/${encodeURIComponent(appId)}/logs`, { method: 'DELETE' });
}

export function streamUrl(appId: string, type?: string): string {
  validateId(appId, 'app ID');
  const API_URL = getApiUrl();
  const qs = type ? `?type=${encodeURIComponent(type)}` : '';
  return `${API_URL}/api/apps/${encodeURIComponent(appId)}/logs/stream${qs}`;
}
