import { request } from '../infrastructure/api.js';
import { validateId } from '../domain/validation.js';
import type { LogEntry } from '../domain/types.js';

export async function execute(
  appId: string,
  serverId: string,
  toolName: string,
  params: Record<string, unknown>,
): Promise<LogEntry> {
  validateId(appId, 'app ID');
  validateId(serverId, 'server ID');
  return request<LogEntry>(`/api/apps/${encodeURIComponent(appId)}/exec`, {
    method: 'POST',
    body: { serverId, tool: toolName, params },
  });
}
