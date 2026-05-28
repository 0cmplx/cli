import * as ToolService from '../../application/tools.js';
import { resolveContext, requireApp } from '../../infrastructure/context.js';
import { fail, W, R, DIM, GREEN } from '../ui/ansi.js';
import { shortId } from '../ui/format.js';
import { runCommand } from './base.js';
import { CLI_BIN } from '../../domain/constants.js';
import type { Command } from '../../router.js';
import type { LogEntry } from '../../domain/types.js';

function parseParams(
  flags: Record<string, string | string[] | boolean>,
): Record<string, unknown> {
  const raw = flags.param;
  if (!raw) return {};

  const values = Array.isArray(raw) ? raw : [raw];
  const params: Record<string, unknown> = {};

  for (const v of values) {
    if (typeof v !== 'string') continue;
    const eq = v.indexOf('=');
    if (eq === -1) {
      params[v] = true;
    } else {
      params[v.slice(0, eq)] = v.slice(eq + 1);
    }
  }

  return params;
}

async function run(
  args: string[],
  flags: Record<string, string | string[] | boolean>,
): Promise<void> {
  const serverId = args[0];
  const toolName = args[1];

  if (!serverId || !toolName) {
    fail(`Usage: ${CLI_BIN} exec <server-id> <tool-name> [--param key=value ...]`);
    process.exit(2);
  }

  const ctx = resolveContext(flags);
  const appId = requireApp(ctx);
  const params = parseParams(flags);

  await runCommand<LogEntry>({
    spinner: `Executing ${toolName}`,
    action: () => ToolService.execute(appId, serverId, toolName, params),
    onSuccess: (result) => {
      console.log('');
      console.log(`  ${DIM}ID:${R}       ${shortId(result.id)}`);
      console.log(`  ${DIM}Status:${R}   ${result.status === 'success' ? `${GREEN}${result.status}${R}` : result.status}`);
      console.log(`  ${DIM}Duration:${R} ${result.duration}ms`);

      if (result.response !== undefined) {
        console.log('');
        console.log(`  ${W}Response${R}`);
        const output = typeof result.response === 'string'
          ? result.response
          : JSON.stringify(result.response, null, 2);
        for (const line of output.split('\n')) {
          console.log(`  ${line}`);
        }
      }
      console.log('');
    },
    flags,
  });
}

export const execCommand: Command = {
  name: 'exec',
  description: 'Execute a tool on a server',
  usage: `${CLI_BIN} exec <server-id> <tool-name> [--param key=value ...]`,
  run,
};
