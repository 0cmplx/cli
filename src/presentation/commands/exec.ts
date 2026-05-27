import * as ToolService from '../../application/tools.js';
import { resolveContext, requireApp } from '../../infrastructure/context.js';
import { createSpinner } from '../ui/spinner.js';
import { fail, W, R, DIM, GREEN } from '../ui/ansi.js';
import { shortId } from '../ui/format.js';
import type { Command } from '../../router.js';

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
    fail('Usage: 0cmplx exec <server-id> <tool-name> [--param key=value ...]');
    process.exit(2);
  }

  const ctx = resolveContext(flags);
  const appId = requireApp(ctx);
  const params = parseParams(flags);

  const spinner = createSpinner(`Executing ${toolName}`).start();

  try {
    const result = await ToolService.execute(appId, serverId, toolName, params);
    spinner.succeed(`${toolName} completed in ${result.duration}ms`);

    if (flags.json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }

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
  } catch (err) {
    spinner.fail(err instanceof Error ? err.message : 'Execution failed');
    process.exit(1);
  }
}

export const execCommand: Command = {
  name: 'exec',
  description: 'Execute a tool on a server',
  usage: '0cmplx exec <server-id> <tool-name> [--param key=value ...]',
  run,
};
