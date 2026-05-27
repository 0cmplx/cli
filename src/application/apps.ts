import { request } from '../infrastructure/api.js';
import { validateId } from '../domain/validation.js';
import type { App } from '../domain/types.js';

export async function create(serverIds?: string[]): Promise<App> {
  const res = await request<{ app: App }>('/api/apps', {
    method: 'POST',
    body: { serverIds },
  });
  return res.app;
}

export async function get(id: string): Promise<App> {
  validateId(id, 'app ID');
  const res = await request<{ app: App }>(`/api/apps/${encodeURIComponent(id)}`);
  return res.app;
}
