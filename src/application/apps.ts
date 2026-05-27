import { request } from '../infrastructure/api.js';
import { validateId } from '../domain/validation.js';
import type { App } from '../domain/types.js';

export async function create(serverIds?: string[]): Promise<App> {
  return request<App>('/api/apps', {
    method: 'POST',
    body: { serverIds },
  });
}

export async function get(id: string): Promise<App> {
  validateId(id, 'app ID');
  return request<App>(`/api/apps/${encodeURIComponent(id)}`);
}
