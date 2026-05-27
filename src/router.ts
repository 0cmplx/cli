import { DIM, W, BOLD, R, GREY, noColor } from './presentation/ui/ansi.js';
import { CLI_BIN } from './domain/constants.js';

export interface Command {
  name: string;
  description: string;
  usage?: string;
  subcommands?: Command[];
  run: (
    args: string[],
    flags: Record<string, string | string[] | boolean>,
  ) => Promise<void>;
}

export function parseArgs(
  argv: string[],
): { positionals: string[]; flags: Record<string, string | string[] | boolean> } {
  const positionals: string[] = [];
  const flags: Record<string, string | string[] | boolean> = {};

  let i = 0;
  while (i < argv.length) {
    const arg = argv[i];

    if (arg === '--') {
      positionals.push(...argv.slice(i + 1));
      break;
    }

    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = argv[i + 1];

      if (!next || next.startsWith('--')) {
        flags[key] = true;
        i++;
      } else {
        const existing = flags[key];
        if (existing !== undefined && existing !== true) {
          if (Array.isArray(existing)) {
            existing.push(next);
          } else {
            flags[key] = [existing as string, next];
          }
        } else {
          flags[key] = next;
        }
        i += 2;
      }
    } else if (arg.startsWith('-') && arg.length === 2) {
      const key = arg.slice(1);
      flags[key] = true;
      i++;
    } else {
      positionals.push(arg);
      i++;
    }
  }

  return { positionals, flags };
}

export function findCommand(
  commands: Command[],
  positionals: string[],
): { command: Command | null; args: string[] } {
  if (positionals.length === 0) return { command: null, args: [] };

  const name = positionals[0];
  const cmd = commands.find((c) => c.name === name);
  if (!cmd) return { command: null, args: positionals };

  // Check for subcommand
  if (cmd.subcommands && positionals.length > 1) {
    const subName = positionals[1];
    const sub = cmd.subcommands.find((s) => s.name === subName);
    if (sub) {
      return { command: sub, args: positionals.slice(2) };
    }
  }

  return { command: cmd, args: positionals.slice(1) };
}

export function printUsage(commands: Command[]): void {
  console.log('');
  console.log(noColor ? `  ${CLI_BIN} - command-line interface` : `  ${W}${BOLD}${CLI_BIN}${R} ${DIM}- command-line interface${R}`);
  console.log('');
  console.log(noColor ? '  Usage:' : `  ${W}Usage:${R}`);
  console.log(`    ${CLI_BIN}               Enter interactive shell`);
  console.log(`    ${CLI_BIN} <command>     Run a command`);
  console.log('');
  console.log(noColor ? '  Commands:' : `  ${W}Commands:${R}`);

  const maxLen = Math.max(...commands.map((c) => c.name.length));
  for (const cmd of commands) {
    const name = cmd.name.padEnd(maxLen + 2);
    if (noColor) {
      console.log(`    ${name}${cmd.description}`);
    } else {
      console.log(`    ${W}${name}${R}${DIM}${cmd.description}${R}`);
    }
  }

  console.log('');
  console.log(noColor ? '  Flags:' : `  ${W}Flags:${R}`);
  console.log('    --help               Show help');
  console.log('    --json               Output as JSON');
  console.log('    --no-color           Disable colours');
  console.log('');
}

// Import commands lazily to avoid circular deps
let _commands: Command[] | null = null;

export async function getCommands(): Promise<Command[]> {
  if (_commands) return _commands;

  const { authCommands } = await import('./presentation/commands/auth.js');
  const { schemaCommands } = await import('./presentation/commands/schema.js');
  const { appCommands } = await import('./presentation/commands/app.js');
  const { serverCommands } = await import('./presentation/commands/server.js');
  const { execCommand } = await import('./presentation/commands/exec.js');
  const { logsCommand } = await import('./presentation/commands/logs.js');
  const { contextCommands } = await import('./presentation/commands/context.js');
  const { helpCommand } = await import('./presentation/commands/help.js');
  const { tryCommand } = await import('./presentation/commands/try.js');

  _commands = [
    tryCommand,
    authCommands,
    schemaCommands,
    appCommands,
    serverCommands,
    execCommand,
    logsCommand,
    contextCommands,
    helpCommand,
  ];
  return _commands;
}
