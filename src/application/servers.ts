import { request } from '../infrastructure/api.js';
import { validateId } from '../domain/validation.js';
import type { Server, ServerListResponse, App } from '../domain/types.js';

export async function list(opts?: { search?: string; category?: string }): Promise<ServerListResponse> {
  const params = new URLSearchParams();
  if (opts?.search) params.set('search', opts.search);
  if (opts?.category) params.set('category', opts.category);
  const qs = params.toString();
  return request<ServerListResponse>(`/api/servers${qs ? `?${qs}` : ''}`);
}

export async function get(id: string): Promise<Server> {
  validateId(id, 'server ID');
  return request<Server>(`/api/servers/${encodeURIComponent(id)}`);
}

export async function install(appId: string, serverId: string): Promise<App> {
  validateId(appId, 'app ID');
  validateId(serverId, 'server ID');
  return request<App>(`/api/apps/${encodeURIComponent(appId)}/servers`, {
    method: 'POST',
    body: { serverId },
  });
}

export async function uninstall(appId: string, serverId: string): Promise<App> {
  validateId(appId, 'app ID');
  validateId(serverId, 'server ID');
  return request<App>(`/api/apps/${encodeURIComponent(appId)}/servers/${encodeURIComponent(serverId)}`, {
    method: 'DELETE',
  });
}
