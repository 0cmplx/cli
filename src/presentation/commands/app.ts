import * as AppService from '../../application/apps.js';
import { fail, W, R, DIM } from '../ui/ansi.js';
import { relativeTime, shortId } from '../ui/format.js';
import { runCommand, requireArg } from './base.js';
import { CLI_BIN } from '../../domain/constants.js';
import type { Command } from '../../router.js';
import type { App } from '../../domain/types.js';

async function create(
  _args: string[],
  flags: Record<string, string | string[] | boolean>,
): Promise<void> {
  await runCommand<App>({
    spinner: 'Creating app',
    action: () => AppService.create(),
    onSuccess: (result) => {
      console.log('');
      console.log(`  ${DIM}ID:${R}       ${W}${result.id}${R}`);
      console.log(`  ${DIM}Created:${R}  ${relativeTime(result.createdAt)}`);
      console.log(`  ${DIM}Servers:${R}  ${result.installedServerIds.length}`);
      console.log('');
      console.log(`  ${DIM}Set as active: ${CLI_BIN} use app ${result.id}${R}`);
      console.log('');
    },
    flags,
  });
}

async function show(
  args: string[],
  flags: Record<string, string | string[] | boolean>,
): Promise<void> {
  const id = requireArg(args, 0, `${CLI_BIN} app show <id>`);

  await runCommand<App>({
    spinner: 'Fetching app',
    action: () => AppService.get(id),
    onSuccess: (result) => {
      console.log('');
      console.log(`  ${DIM}ID:${R}       ${W}${result.id}${R}`);
      console.log(`  ${DIM}Created:${R}  ${relativeTime(result.createdAt)}`);
      console.log(`  ${DIM}Expires:${R}  ${relativeTime(result.expiresAt)}`);
      console.log(`  ${DIM}Servers:${R}  ${result.installedServerIds.length > 0 ? result.installedServerIds.join(', ') : 'none'}`);
      console.log('');
    },
    flags,
  });
}

export const appCommands: Command = {
  name: 'app',
  description: 'Manage apps',
  usage: `${CLI_BIN} app <create|show>`,
  subcommands: [
    { name: 'create', description: 'Create a new app', run: create },
    { name: 'show', description: 'Show app details', run: show },
  ],
  run: async (args, flags) => {
    if (args.length > 0) {
      await show(args, flags);
    } else {
      fail(`Usage: ${CLI_BIN} app <create|show>`);
      process.exit(2);
    }
  },
};
