import * as ServerService from '../../application/servers.js';
import { resolveContext, requireApp } from '../../infrastructure/context.js';
import { printTable } from '../ui/table.js';
import { W, R, DIM, CYAN, ARROW } from '../ui/ansi.js';
import { shortId } from '../ui/format.js';
import { runCommand, requireArg, getFlag } from './base.js';
import { CLI_BIN } from '../../domain/constants.js';
import type { Command } from '../../router.js';
import type { Server, ServerListResponse, App } from '../../domain/types.js';

async function list(
  _args: string[],
  flags: Record<string, string | string[] | boolean>,
): Promise<void> {
  const search = getFlag(flags, 'search');
  const category = getFlag(flags, 'category');

  await runCommand<ServerListResponse>({
    spinner: 'Fetching servers',
    action: () => ServerService.list({ search, category }),
    onSuccess: (result) => {
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
    },
    flags,
  });
}

async function show(
  args: string[],
  flags: Record<string, string | string[] | boolean>,
): Promise<void> {
  const id = requireArg(args, 0, `${CLI_BIN} server show <id>`);

  await runCommand<Server>({
    spinner: 'Fetching server',
    action: () => ServerService.get(id),
    onSuccess: (result) => {
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
    },
    flags,
  });
}

async function install(
  args: string[],
  flags: Record<string, string | string[] | boolean>,
): Promise<void> {
  const serverId = requireArg(args, 0, `${CLI_BIN} server install <server-id> [--app <app-id>]`);
  const ctx = resolveContext(flags);
  const appId = requireApp(ctx);

  await runCommand<App>({
    spinner: `Installing ${serverId}`,
    action: () => ServerService.install(appId, serverId),
    onSuccess: (result) => {
      console.log(`  Installed into ${shortId(result.id)}`);
    },
    flags,
  });
}

async function uninstall(
  args: string[],
  flags: Record<string, string | string[] | boolean>,
): Promise<void> {
  const serverId = requireArg(args, 0, `${CLI_BIN} server uninstall <server-id> [--app <app-id>]`);
  const ctx = resolveContext(flags);
  const appId = requireApp(ctx);

  await runCommand<App>({
    spinner: `Uninstalling ${serverId}`,
    action: () => ServerService.uninstall(appId, serverId),
    onSuccess: (result) => {
      console.log(`  Uninstalled from ${shortId(result.id)}`);
    },
    flags,
  });
}

export const serverCommands: Command = {
  name: 'server',
  description: 'Browse and manage MCP servers',
  usage: `${CLI_BIN} server <list|show|install|uninstall>`,
  subcommands: [
    { name: 'list', description: 'List available servers', run: list },
    { name: 'show', description: 'Show server details', run: show },
    { name: 'install', description: 'Install a server into an app', run: install },
    { name: 'uninstall', description: 'Uninstall a server from an app', run: uninstall },
  ],
  run: async (_args, flags) => list([], flags),
};
