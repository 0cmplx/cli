import * as AppService from '../../application/apps.js';
import { createSpinner } from '../ui/spinner.js';
import { fail, W, R, DIM } from '../ui/ansi.js';
import { relativeTime, shortId } from '../ui/format.js';
import type { Command } from '../../router.js';

async function create(
  _args: string[],
  flags: Record<string, string | string[] | boolean>,
): Promise<void> {
  const spinner = createSpinner('Creating app').start();

  try {
    const result = await AppService.create();
    spinner.succeed('App created');

    if (flags.json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    console.log('');
    console.log(`  ${DIM}ID:${R}       ${W}${result.id}${R}`);
    console.log(`  ${DIM}Created:${R}  ${relativeTime(result.createdAt)}`);
    console.log(`  ${DIM}Servers:${R}  ${result.servers.length}`);
    console.log('');
    console.log(`  ${DIM}Set as active: 0cmplx context use --app ${shortId(result.id)}${R}`);
    console.log('');
  } catch (err) {
    spinner.fail(err instanceof Error ? err.message : 'Failed to create app');
    process.exit(1);
  }
}

async function show(
  args: string[],
  flags: Record<string, string | string[] | boolean>,
): Promise<void> {
  const id = args[0];
  if (!id) {
    fail('Usage: 0cmplx app show <id>');
    process.exit(2);
  }

  const spinner = createSpinner('Fetching app').start();

  try {
    const result = await AppService.get(id);
    spinner.succeed(result.name ?? shortId(result.id));

    if (flags.json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    console.log('');
    console.log(`  ${DIM}ID:${R}       ${W}${result.id}${R}`);
    if (result.name) {
      console.log(`  ${DIM}Name:${R}     ${result.name}`);
    }
    if (result.schemaId) {
      console.log(`  ${DIM}Schema:${R}   ${result.schemaId}`);
    }
    console.log(`  ${DIM}Created:${R}  ${relativeTime(result.createdAt)}`);
    console.log(`  ${DIM}Servers:${R}  ${result.servers.length > 0 ? result.servers.join(', ') : 'none'}`);
    console.log('');
  } catch (err) {
    spinner.fail(err instanceof Error ? err.message : 'Failed to fetch app');
    process.exit(1);
  }
}

export const appCommands: Command = {
  name: 'app',
  description: 'Manage apps',
  usage: '0cmplx app <create|show>',
  subcommands: [
    { name: 'create', description: 'Create a new app', run: create },
    { name: 'show', description: 'Show app details', run: show },
  ],
  run: async (args, flags) => {
    if (args.length > 0) {
      await show(args, flags);
    } else {
      fail('Usage: 0cmplx app <create|show>');
      process.exit(2);
    }
  },
};
