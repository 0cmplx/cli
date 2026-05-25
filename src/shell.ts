import { createInterface, type Interface } from 'readline';
import { loadCredentials } from './credentials.js';
import { authLogin, authStatus, authLogout } from './auth.js';

const R = '\x1b[0m';
const DIM = '\x1b[2m';
const BOLD = '\x1b[1m';
const W = '\x1b[97m';
const GREY = '\x1b[90m';
const GREEN = '\x1b[32m';
const CYAN = '\x1b[36m';
const RED = '\x1b[31m';
const D = '\x1b[38;5;240m';

// Capsule logo: top half light, bottom half dark, hole in center
const LOGO = [
  '',
  `   ${W}${BOLD} ██████${R}${DIM}  ██████ ███    ███ ██████  ${R}`,
  `   ${W}${BOLD}██  ████${R}${DIM} ██      ████  ████ ██   ██ ${R}`,
  `   ${W}${BOLD}██ ██ ██${R}${DIM} ██      ██ ████ ██ ██████  ${R}`,
  `   ${W}${BOLD}████  ██${R}${DIM} ██      ██  ██  ██ ██      ${R}`,
  `   ${W}${BOLD} ██████${R}${DIM}  ██████ ██      ██ ██      ${R}`,
  '',
];

function printWelcome(): void {
  console.clear();
  LOGO.forEach((line) => console.log(line));

  const creds = loadCredentials();
  if (creds) {
    console.log(`  ${GREEN}●${R} ${W}${creds.login}${R} ${DIM}${creds.tier}${R}`);
  } else {
    console.log(`  ${DIM}●${R} ${DIM}not authenticated  ${GREY}type ${W}auth${GREY} to connect${R}`);
  }
  console.log('');
}

function printHelp(): void {
  console.log('');
  console.log(`  ${W}${BOLD}auth${R}              ${DIM}Authenticate with an API token${R}`);
  console.log(`  ${W}${BOLD}auth status${R}       ${DIM}Show current authentication${R}`);
  console.log(`  ${W}${BOLD}auth logout${R}       ${DIM}Clear stored credentials${R}`);
  console.log(`  ${W}${BOLD}whoami${R}            ${DIM}Show current user${R}`);
  console.log(`  ${W}${BOLD}clear${R}             ${DIM}Clear the screen${R}`);
  console.log(`  ${W}${BOLD}exit${R}              ${DIM}Exit${R}`);
  console.log('');
}

async function handleCommand(input: string, rl: Interface): Promise<boolean> {
  const parts = input.trim().split(/\s+/);
  const cmd = parts[0];
  const sub = parts[1];

  if (!cmd) return true;

  switch (cmd) {
    case 'exit':
    case 'quit':
    case 'q':
      return false;

    case 'help':
    case '?':
      printHelp();
      return true;

    case 'clear':
      printWelcome();
      return true;

    case 'whoami': {
      const creds = loadCredentials();
      if (!creds) {
        console.log(`\n  ${DIM}●${R} ${DIM}not authenticated${R}\n`);
      } else {
        console.log(`\n  ${GREEN}●${R} ${W}${creds.login}${R} ${DIM}${creds.tier}  ${creds.scopes.length} scopes${R}\n`);
      }
      return true;
    }

    case 'auth':
      rl.pause();
      try {
        if (!sub || sub === 'login') {
          await authLogin();
        } else if (sub === 'status') {
          authStatus();
        } else if (sub === 'logout') {
          await authLogout();
        } else {
          console.log(`  ${RED}Unknown: auth ${sub}${R}`);
        }
      } finally {
        rl.resume();
      }
      return true;

    default:
      console.log(`  ${RED}unknown:${R} ${DIM}${cmd}${R}`);
      return true;
  }
}

export async function startShell(): Promise<void> {
  printWelcome();

  const prompt = `  ${CYAN}0cx${R} ${GREY}\u203a${R} `;

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt,
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
