import { getCommands, printUsage } from '../../router.js';
import { W, BOLD, R, DIM, CYAN, ARROW } from '../ui/ansi.js';
import { CLI_BIN } from '../../domain/constants.js';
import type { Command } from '../../router.js';

async function run(
  args: string[],
  _flags: Record<string, string | string[] | boolean>,
): Promise<void> {
  const commands = await getCommands();

  // Help for specific command
  if (args.length > 0) {
    const name = args[0];
    const cmd = commands.find((c) => c.name === name);
    if (!cmd) {
      console.error(`Unknown command: ${name}`);
      process.exit(2);
    }

    console.log('');
    console.log(`  ${W}${BOLD}${cmd.name}${R} ${DIM}- ${cmd.description}${R}`);
    if (cmd.usage) {
      console.log(`  ${DIM}Usage: ${cmd.usage}${R}`);
    }
    console.log('');

    if (cmd.subcommands) {
      const maxLen = Math.max(...cmd.subcommands.map((s) => s.name.length));
      for (const sub of cmd.subcommands) {
        const padded = sub.name.padEnd(maxLen + 2);
        console.log(`    ${CYAN}${ARROW}${R} ${W}${padded}${R}${DIM}${sub.description}${R}`);
      }
      console.log('');
    }
    return;
  }

  printUsage(commands);
}

export const helpCommand: Command = {
  name: 'help',
  description: 'Show help for commands',
  usage: `${CLI_BIN} help [command]`,
  run,
};
