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

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const token = (await rl.question('  Token: ')).trim();
  rl.close();

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

export function authLogout(): void {
  const removed = clearCredentials();
  if (removed) {
    console.log('Credentials cleared.');
  } else {
    console.log('No credentials found.');
  }
}
