import * as LogService from '../../application/logs.js';
import { getToken } from '../../infrastructure/credentials.js';
import { resolveContext, requireApp } from '../../infrastructure/context.js';
import { printTable } from '../ui/table.js';
import { fail, W, R, DIM, GREEN, RED, YELLOW, GREY } from '../ui/ansi.js';
import { relativeTime, shortId } from '../ui/format.js';
import { runCommand, getFlag } from './base.js';
import { CLI_BIN } from '../../domain/constants.js';
import { ERRORS } from '../../domain/errors.js';
import type { Command } from '../../router.js';
import type { LogsResponse } from '../../domain/types.js';

function statusColour(status: string): string {
  if (status === 'success') return `${GREEN}${status}${R}`;
  if (status === 'error') return `${RED}${status}${R}`;
  return `${YELLOW}${status}${R}`;
}

async function list(
  _args: string[],
  flags: Record<string, string | string[] | boolean>,
): Promise<void> {
  const ctx = resolveContext(flags);
  const appId = requireApp(ctx);
  const type = getFlag(flags, 'type');

  await runCommand<LogsResponse>({
    spinner: 'Fetching logs',
    action: () => LogService.list(appId, type),
    onSuccess: (result) => {
      console.log('');
      printTable(
        [
          { key: 'id', label: 'ID' },
          { key: 'type', label: 'Type' },
          { key: 'tool', label: 'Tool' },
          { key: 'status', label: 'Status' },
          { key: 'duration', label: 'Duration', align: 'right' },
          { key: 'when', label: 'When' },
        ],
        result.logs.map((l) => ({
          id: shortId(l.id),
          type: l.type,
          tool: l.tool,
          status: statusColour(l.status),
          duration: `${l.duration}ms`,
          when: relativeTime(l.createdAt),
        })),
      );
      console.log('');
    },
    flags,
  });
}

async function follow(
  _args: string[],
  flags: Record<string, string | string[] | boolean>,
): Promise<void> {
  const ctx = resolveContext(flags);
  const appId = requireApp(ctx);
  const token = getToken();
  if (!token) {
    fail(ERRORS.NOT_AUTHENTICATED);
    process.exit(1);
  }

  const type = getFlag(flags, 'type');
  const url = LogService.streamUrl(appId, type);

  console.log(`  ${DIM}Streaming logs for ${shortId(appId)}... (Ctrl+C to stop)${R}`);
  console.log('');

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'text/event-stream',
      },
    });

    if (!res.ok) {
      fail(`Stream error: ${res.status}`);
      process.exit(1);
    }

    const reader = res.body?.getReader();
    if (!reader) {
      fail('No response body');
      process.exit(1);
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const entry = JSON.parse(line.slice(6));
            const status = statusColour(entry.status ?? 'unknown');
            console.log(
              `  ${GREY}${relativeTime(entry.createdAt ?? new Date().toISOString())}${R}  ${W}${entry.tool ?? 'unknown'}${R}  ${status}  ${DIM}${entry.duration ?? 0}ms${R}`,
            );
          } catch { /* skip malformed */ }
        }
      }
    }
  } catch (err) {
    if ((err as Error).name === 'AbortError') return;
    fail(err instanceof Error ? err.message : 'Stream failed');
    process.exit(1);
  }
}

async function clear(
  _args: string[],
  flags: Record<string, string | string[] | boolean>,
): Promise<void> {
  const ctx = resolveContext(flags);
  const appId = requireApp(ctx);

  await runCommand<void>({
    spinner: 'Clearing logs',
    action: () => LogService.clear(appId),
    onSuccess: () => { /* spinner.succeed already shown */ },
    flags,
  });
}

async function run(
  args: string[],
  flags: Record<string, string | string[] | boolean>,
): Promise<void> {
  if (flags.follow || flags.f) {
    return follow(args, flags);
  }
  return list(args, flags);
}

export const logsCommand: Command = {
  name: 'logs',
  description: 'View execution logs',
  usage: `${CLI_BIN} logs [--follow] [--type <type>] [--app <id>]`,
  subcommands: [
    { name: 'clear', description: 'Clear all logs', run: clear },
  ],
  run,
};
