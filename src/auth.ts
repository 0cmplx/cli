import { createInterface } from 'readline/promises';
import { saveCredentials, loadCredentials, clearCredentials } from './credentials.js';
import { verifyToken } from './client.js';

export async function authLogin(): Promise<void> {
  const creds = loadCredentials();
  if (creds) {
    console.log(`Already authenticated as ${creds.login} (${creds.tier})`);
    console.log('Run "0cmplx auth logout" first to switch accounts.');
    return;
  }

  console.log('');
  console.log('  Paste your API token below.');
  console.log('  Generate one at: Settings > Programmatic Access');
  console.log('');

  // Hide token input (like password prompts)
  process.stdout.write('  Token: ');
  const token = await new Promise<string>((resolve) => {
    let buf = '';
    const stdin = process.stdin;
    const wasRaw = stdin.isRaw;
    if (stdin.isTTY) stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf-8');
    const onData = (ch: string) => {
      if (ch === '\n' || ch === '\r') {
        stdin.removeListener('data', onData);
        if (stdin.isTTY) stdin.setRawMode(wasRaw ?? false);
        stdin.pause();
        process.stdout.write('\n');
        resolve(buf.trim());
      } else if (ch === '\u0003') {
        process.exit(1);
      } else if (ch === '\u007f' || ch === '\b') {
        buf = buf.slice(0, -1);
      } else {
        buf += ch;
      }
    };
    stdin.on('data', onData);
  });

  if (!token) {
    console.error('No token provided.');
    process.exit(1);
  }

  if (!token.startsWith('0cx_')) {
    console.error('Invalid token format. Tokens start with "0cx_".');
    process.exit(1);
  }

  console.log('');
  console.log('  Verifying...');

  try {
    const result = await verifyToken(token);

    saveCredentials({
      token,
      login: result.user.login,
      tier: result.user.tier,
      scopes: result.scopes,
      savedAt: new Date().toISOString(),
    });

    console.log(`  Authenticated as ${result.user.login} (${result.user.tier})`);
    console.log(`  Scopes: ${result.scopes.join(', ')}`);
    console.log('');
  } catch (err) {
    console.error(`  ${err instanceof Error ? err.message : 'Verification failed'}`);
    process.exit(1);
  }
}

export function authStatus(): void {
  const creds = loadCredentials();
  if (!creds) {
    console.log('Not authenticated. Run "0cmplx auth" to log in.');
    return;
  }

  console.log('');
  console.log(`  User:   ${creds.login}`);
  console.log(`  Tier:   ${creds.tier}`);
  console.log(`  Scopes: ${creds.scopes.join(', ')}`);
  console.log(`  Since:  ${creds.savedAt}`);
  console.log('');
}

export async function authLogout(): Promise<void> {
  const creds = loadCredentials();
  if (!creds) {
    console.log('No credentials found.');
    return;
  }

  // Notify server
  try {
    const { logoutOnServer } = await import('./client.js');
    await logoutOnServer(creds.token);
  } catch { /* best effort */ }

  clearCredentials();
  console.log('Credentials cleared.');
}
