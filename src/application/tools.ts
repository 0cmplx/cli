import { request } from '../infrastructure/api.js';
import type { LogEntry } from '../domain/types.js';

export async function execute(
  appId: string,
  serverId: string,
  toolName: string,
  params: Record<string, unknown>,
): Promise<LogEntry> {
  return request<LogEntry>(`/api/apps/${appId}/exec`, {
    method: 'POST',
    body: { serverId, tool: toolName, params },
  });
}
