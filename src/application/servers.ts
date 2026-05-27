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
  const res = await request<{ server: Server }>(`/api/servers/${encodeURIComponent(id)}`);
  return res.server;
}

export async function install(appId: string, serverId: string): Promise<App> {
  validateId(appId, 'app ID');
  validateId(serverId, 'server ID');
  const res = await request<{ app: App }>(`/api/apps/${encodeURIComponent(appId)}/servers`, {
    method: 'POST',
    body: { serverId },
  });
  return res.app;
}

export async function uninstall(appId: string, serverId: string): Promise<App> {
  validateId(appId, 'app ID');
  validateId(serverId, 'server ID');
  const res = await request<{ app: App }>(`/api/apps/${encodeURIComponent(appId)}/servers/${encodeURIComponent(serverId)}`, {
    method: 'DELETE',
  });
  return res.app;
}
