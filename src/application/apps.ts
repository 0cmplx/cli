import { request } from '../infrastructure/api.js';
import type { App } from '../domain/types.js';

export async function create(serverIds?: string[]): Promise<App> {
  return request<App>('/api/apps', {
    method: 'POST',
    body: { serverIds },
  });
}

export async function get(id: string): Promise<App> {
  return request<App>(`/api/apps/${id}`);
}
