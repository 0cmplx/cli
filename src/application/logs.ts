import { request, getApiUrl } from '../infrastructure/api.js';
import type { LogsResponse } from '../domain/types.js';

export async function list(appId: string, type?: string): Promise<LogsResponse> {
  const qs = type ? `?type=${encodeURIComponent(type)}` : '';
  return request<LogsResponse>(`/api/apps/${appId}/logs${qs}`);
}

export async function clear(appId: string): Promise<void> {
  return request<void>(`/api/apps/${appId}/logs`, { method: 'DELETE' });
}

export function streamUrl(appId: string, type?: string): string {
  const API_URL = getApiUrl();
  const qs = type ? `?type=${encodeURIComponent(type)}` : '';
  return `${API_URL}/api/apps/${appId}/logs/stream${qs}`;
}
