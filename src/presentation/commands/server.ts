import * as ServerService from '../../application/servers.js';
import { resolveContext, requireApp } from '../../infrastructure/context.js';
import { createSpinner } from '../ui/spinner.js';
import { printTable } from '../ui/table.js';
import { fail, W, R, DIM, CYAN, ARROW } from '../ui/ansi.js';
import { shortId } from '../ui/format.js';
import type { Command } from '../../router.js';

async function list(
  _args: string[],
  flags: Record<string, string | string[] | boolean>,
): Promise<void> {
  const spinner = createSpinner('Fetching servers').start();

  try {
    const search = typeof flags.search === 'string' ? flags.search : undefined;
    const category = typeof flags.category === 'string' ? flags.category : undefined;
    const result = await ServerService.list({ search, category });
    spinner.succeed(`${result.servers.length} server(s) found`);

    if (flags.json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    console.log('');
    printTable(
      [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'category', label: 'Category' },
        { key: 'tools', label: 'Tools', align: 'right' },
      ],
      result.servers.map((s) => ({
        id: shortId(s.id),
        name: s.name,
        category: s.category,
        tools: s.tools.length,
      })),
    );
    console.log('');
  } catch (err) {
    spinner.fail(err instanceof Error ? err.message : 'Failed to list servers');
    process.exit(1);
  }
}

async function show(
  args: string[],
  flags: Record<string, string | string[] | boolean>,
): Promise<void> {
  const id = args[0];
  if (!id) {
    fail('Usage: 0cmplx server show <id>');
    process.exit(2);
  }

  const spinner = createSpinner('Fetching server').start();

  try {
    const result = await ServerService.get(id);
    spinner.succeed(result.name);

    if (flags.json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    console.log('');
    console.log(`  ${DIM}ID:${R}          ${W}${result.id}${R}`);
    console.log(`  ${DIM}Name:${R}        ${result.name}`);
    console.log(`  ${DIM}Category:${R}    ${result.category}`);
    console.log(`  ${DIM}Description:${R} ${result.description}`);
    console.log('');
    console.log(`  ${W}Tools${R}`);
    for (const tool of result.tools) {
      console.log(`    ${CYAN}${ARROW}${R} ${W}${tool.name}${R}  ${DIM}${tool.description}${R}`);
    }
    console.log('');
  } catch (err) {
    spinner.fail(err instanceof Error ? err.message : 'Failed to fetch server');
    process.exit(1);
  }
}

async function install(
  args: string[],
  flags: Record<string, string | string[] | boolean>,
): Promise<void> {
  const serverId = args[0];
  if (!serverId) {
    fail('Usage: 0cmplx server install <server-id> [--app <app-id>]');
    process.exit(2);
  }

  const ctx = resolveContext(flags);
  const appId = requireApp(ctx);

  const spinner = createSpinner(`Installing ${serverId}`).start();

  try {
    const result = await ServerService.install(appId, serverId);
    spinner.succeed(`Installed into ${shortId(result.id)}`);

    if (flags.json) {
      console.log(JSON.stringify(result, null, 2));
    }
  } catch (err) {
    spinner.fail(err instanceof Error ? err.message : 'Install failed');
    process.exit(1);
  }
}

async function uninstall(
  args: string[],
  flags: Record<string, string | string[] | boolean>,
): Promise<void> {
  const serverId = args[0];
  if (!serverId) {
    fail('Usage: 0cmplx server uninstall <server-id> [--app <app-id>]');
    process.exit(2);
  }

  const ctx = resolveContext(flags);
  const appId = requireApp(ctx);

  const spinner = createSpinner(`Uninstalling ${serverId}`).start();

  try {
    const result = await ServerService.uninstall(appId, serverId);
    spinner.succeed(`Uninstalled from ${shortId(result.id)}`);

    if (flags.json) {
      console.log(JSON.stringify(result, null, 2));
    }
  } catch (err) {
    spinner.fail(err instanceof Error ? err.message : 'Uninstall failed');
    process.exit(1);
  }
}

export const serverCommands: Command = {
  name: 'server',
  description: 'Browse and manage MCP servers',
  usage: '0cmplx server <list|show|install|uninstall>',
  subcommands: [
    { name: 'list', description: 'List available servers', run: list },
    { name: 'show', description: 'Show server details', run: show },
    { name: 'install', description: 'Install a server into an app', run: install },
    { name: 'uninstall', description: 'Uninstall a server from an app', run: uninstall },
  ],
  run: async (_args, flags) => list([], flags),
};
