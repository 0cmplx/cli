import { createInterface, type Interface } from 'readline';
import { loadCredentials } from './infrastructure/credentials.js';
import { resolveContext } from './infrastructure/context.js';
import { parseArgs, findCommand, getCommands } from './router.js';
import {
  R, DIM, BOLD, W, GREY, GREEN, CYAN, RED, D,
} from './presentation/ui/ansi.js';
import { shortId } from './presentation/ui/format.js';

const LOGO = [
  '',
  `   ${W}${BOLD} ██████${R}${DIM}  ██████ ███    ███ ██████  ${R}`,
  `   ${W}${BOLD}██  ████${R}${DIM} ██      ████  ████ ██   ██ ${R}`,
  `   ${W}${BOLD}██ ██ ██${R}${DIM} ██      ██ ████ ██ ██████  ${R}`,
  `   ${W}${BOLD}████  ██${R}${DIM} ██      ██  ██  ██ ██      ${R}`,
  `   ${W}${BOLD} ██████${R}${DIM}  ██████ ██      ██ ██      ${R}`,
  '',
];

function getPrompt(): string {
  const ctx = resolveContext({});
  const label = ctx.app ? ` ${shortId(ctx.app)}` : '';
  return `  ${CYAN}0cx${label}${R} ${GREY}\u203a${R} `;
}

function printWelcome(): void {
  console.clear();
  LOGO.forEach((line) => console.log(line));

  const creds = loadCredentials();
  if (creds) {
    console.log(`  ${GREEN}\u25cf${R} ${W}${creds.login}${R} ${DIM}${creds.tier}${R}`);
  } else {
    console.log(`  ${DIM}\u25cf${R} ${DIM}not authenticated  ${GREY}type ${W}auth${GREY} to connect${R}`);
  }
  console.log('');
}

function printHelp(commands: { name: string; description: string }[]): void {
  console.log('');
  console.log(`  ${W}${BOLD}Shell commands${R}`);
  console.log(`    ${W}exit${R}    ${DIM}Exit the shell${R}`);
  console.log(`    ${W}clear${R}   ${DIM}Clear the screen${R}`);
  console.log(`    ${W}whoami${R}  ${DIM}Show current user${R}`);
  console.log(`    ${W}help${R}    ${DIM}Show this help${R}`);
  console.log('');
  console.log(`  ${W}${BOLD}Commands${R}`);
  const maxLen = Math.max(...commands.map((c) => c.name.length));
  for (const cmd of commands) {
    const padded = cmd.name.padEnd(maxLen + 2);
    console.log(`    ${W}${padded}${R}${DIM}${cmd.description}${R}`);
  }
  console.log('');
}

async function handleCommand(
  input: string,
  rl: Interface,
): Promise<boolean> {
  const trimmed = input.trim();
  if (!trimmed) return true;

  // Built-in shell commands
  switch (trimmed) {
    case 'exit':
    case 'quit':
    case 'q':
      return false;

    case 'clear':
      printWelcome();
      return true;

    case 'whoami': {
      const creds = loadCredentials();
      if (!creds) {
        console.log(`\n  ${DIM}\u25cf${R} ${DIM}not authenticated${R}\n`);
      } else {
        console.log(`\n  ${GREEN}\u25cf${R} ${W}${creds.login}${R} ${DIM}${creds.tier}  ${creds.scopes.length} scopes${R}\n`);
      }
      return true;
    }

    case 'help':
    case '?': {
      const commands = await getCommands();
      printHelp(commands);
      return true;
    }
  }

  // Delegate to command router
  const parts = trimmed.split(/\s+/);
  const { positionals, flags } = parseArgs(parts);
  const commands = await getCommands();
  const { command, args } = findCommand(commands, positionals);

  if (!command) {
    console.log(`  ${RED}unknown:${R} ${DIM}${parts[0]}${R}`);
    return true;
  }

  rl.pause();
  try {
    await command.run(args, flags);
  } catch (err) {
    console.error(`  ${RED}${err instanceof Error ? err.message : 'Command failed'}${R}`);
  } finally {
    rl.resume();
  }

  return true;
}

export async function startShell(): Promise<void> {
  printWelcome();

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: getPrompt(),
    terminal: true,
  });

  rl.prompt();

  const onLine = async (line: string) => {
    rl.removeListener('line', onLine);
    const shouldContinue = await handleCommand(line, rl);
    if (!shouldContinue) {
      rl.close();
      return;
    }
    // Refresh prompt (context may have changed)
    rl.setPrompt(getPrompt());
    rl.on('line', onLine);
    rl.prompt();
  };

  rl.on('line', onLine);

  rl.on('close', () => {
    console.log('');
    process.exit(0);
  });

  await new Promise(() => {});
}
