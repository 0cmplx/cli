import { verifyTokenRequest, logoutRequest } from '../infrastructure/api.js';
import { saveCredentials, loadCredentials, clearCredentials } from '../infrastructure/credentials.js';
import { AuthError, ERRORS } from '../domain/errors.js';
import type { AuthVerification, Credentials } from '../domain/types.js';

export async function verifyToken(token: string): Promise<AuthVerification> {
  try {
    return await verifyTokenRequest(token);
  } catch (err) {
    if (err instanceof Error && err.message === ERRORS.INVALID_TOKEN) {
      throw new AuthError(ERRORS.INVALID_TOKEN);
    }
    throw err;
  }
}

export async function login(token: string): Promise<Credentials> {
  const result = await verifyToken(token);

  const creds: Credentials = {
    token,
    login: result.user.login,
    tier: result.user.tier,
    scopes: result.scopes,
    savedAt: new Date().toISOString(),
  };

  saveCredentials(creds);
  return creds;
}

export async function logout(): Promise<void> {
  const creds = loadCredentials();
  if (!creds) return;

  await logoutRequest(creds.token);
  clearCredentials();
}

export function getStatus(): Credentials | null {
  return loadCredentials();
}
