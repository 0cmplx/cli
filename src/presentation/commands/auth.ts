import * as AuthService from '../../application/auth.js';
import { getCredentialBackend } from '../../infrastructure/credentials.js';
import { createSpinner } from '../ui/spinner.js';
import { ok, fail, heading, W, R, DIM, GREEN } from '../ui/ansi.js';
import { input } from '../ui/prompt.js';
import type { Command } from '../../router.js';

const BACKEND_LABELS: Record<string, string> = {
  mac: 'macOS Keychain',
  linux: 'GNOME Keyring',
  file: 'encrypted file',
};

async function login(): Promise<void> {
  const creds = AuthService.getStatus();
  if (creds) {
    console.log(`  Already authenticated as ${W}${creds.login}${R} ${DIM}(${creds.tier})${R}`);
    console.log(`  Run ${W}0cmplx auth logout${R} first to switch accounts.`);
    return;
  }

  heading('Authenticate');
  console.log(`  Paste your API token below.`);
  console.log(`  ${DIM}Generate one at: Settings > Programmatic Access${R}`);
  console.log('');

  const token = await input('Token:', { hidden: true });

  if (!token) {
    fail('No token provided.');
    process.exit(1);
  }

  if (!token.startsWith('0cx_')) {
    fail('Invalid token format. Tokens start with "0cx_".');
    process.exit(1);
  }

  const spinner = createSpinner('Verifying token').start();

  try {
    const result = await AuthService.verifyToken(token);
    await AuthService.login(token);

    spinner.succeed(`Authenticated as ${result.user.login} (${result.user.tier})`);
    console.log(`  ${DIM}Scopes: ${result.scopes.join(', ')}${R}`);
    console.log('');
  } catch (err) {
    spinner.fail(err instanceof Error ? err.message : 'Verification failed');
    process.exit(1);
  }
}

function status(
  _args: string[],
  flags: Record<string, string | string[] | boolean>,
): void {
  const creds = AuthService.getStatus();
  if (!creds) {
    console.log('  Not authenticated. Run "0cmplx auth" to log in.');
    return;
  }

  if (flags.json) {
    console.log(JSON.stringify({
      login: creds.login,
      tier: creds.tier,
      scopes: creds.scopes,
      since: creds.savedAt,
    }, null, 2));
    return;
  }

  const backend = getCredentialBackend();

  console.log('');
  console.log(`  ${GREEN}\u25cf${R} ${W}${creds.login}${R}`);
  console.log(`  ${DIM}Tier:    ${R}${creds.tier}`);
  console.log(`  ${DIM}Scopes:  ${R}${creds.scopes.join(', ')}`);
  console.log(`  ${DIM}Since:   ${R}${creds.savedAt}`);
  console.log(`  ${DIM}Storage: ${R}${BACKEND_LABELS[backend] || backend}`);
  console.log('');
}

async function logout(): Promise<void> {
  const creds = AuthService.getStatus();
  if (!creds) {
    console.log('  No credentials found.');
    return;
  }

  const spinner = createSpinner('Signing out').start();

  try {
    await AuthService.logout();
  } catch { /* best effort */ }

  spinner.succeed('Credentials cleared.');
}

export const authCommands: Command = {
  name: 'auth',
  description: 'Authenticate with an API token',
  usage: '0cmplx auth [login|status|logout]',
  subcommands: [
    {
      name: 'login',
      description: 'Log in with an API token',
      run: async () => login(),
    },
    {
      name: 'status',
      description: 'Show current authentication',
      run: async (args, flags) => status(args, flags),
    },
    {
      name: 'logout',
      description: 'Clear stored credentials',
      run: async () => logout(),
    },
  ],
  run: async () => login(),
};
