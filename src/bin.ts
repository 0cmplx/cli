#!/usr/bin/env node

import { startShell } from './shell.js';
import { parseArgs, findCommand, getCommands, printUsage } from './router.js';
import { CLI_BIN } from './domain/constants.js';

const { positionals, flags } = parseArgs(process.argv.slice(2));

async function main(): Promise<void> {
  const commands = await getCommands();

  if (!positionals.length && !flags.help && !flags.h && !flags.version && !flags.v) {
    await startShell();
    return;
  }

  if (flags.version || flags.v) {
    const { readFileSync } = await import('fs');
    const { join, dirname } = await import('path');
    const { fileURLToPath } = await import('url');
    try {
      const pkg = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'package.json'), 'utf-8'));
      console.log(pkg.version);
    } catch {
      console.log('unknown');
    }
    return;
  }

  if (positionals[0] === 'help' || flags.help || flags.h) {
    if (positionals[0] === 'help') {
      const helpCmd = commands.find((c) => c.name === 'help');
      if (helpCmd) {
        await helpCmd.run(positionals.slice(1), flags);
        return;
      }
    }
    printUsage(commands);
    return;
  }

  const { command, args } = findCommand(commands, positionals);

  if (!command) {
    console.error(`Unknown command: ${positionals[0]}`);
    console.error(`Run "${CLI_BIN} help" for usage.`);
    process.exit(2);
  }

  await command.run(args, flags);
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
