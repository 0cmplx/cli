import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { homedir, platform } from 'os';
import { execFileSync, execSync } from 'child_process';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';
import type { Credentials } from '../domain/types.js';
import {
  CONFIG_DIR_NAME,
  CREDENTIALS_FILE,
  ENCRYPTED_CREDENTIALS_FILE,
  KEY_FILE as KEY_FILE_NAME,
  KEYCHAIN_SERVICE,
  KEYCHAIN_ACCOUNT,
  ENCRYPTION_ALGORITHM,
  KEY_DERIVATION_SALT,
  KEY_LENGTH,
  IV_LENGTH,
  DIR_MODE,
  FILE_MODE,
} from '../domain/constants.js';

const CONFIG_DIR = join(homedir(), CONFIG_DIR_NAME);
const FALLBACK_FILE = join(CONFIG_DIR, ENCRYPTED_CREDENTIALS_FILE);
const KEY_FILE = join(CONFIG_DIR, KEY_FILE_NAME);

// ── Keychain backends ─────────────────────────────────────────────

function isMacOS(): boolean {
  return platform() === 'darwin';
}

function isLinux(): boolean {
  return platform() === 'linux';
}

function hasSecretTool(): boolean {
  try {
    execFileSync('which', ['secret-tool'], { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

// ── macOS Keychain (no shell, no interpolation) ───────────────────

function macSave(data: string): void {
  try {
    execFileSync('security', ['delete-generic-password', '-s', KEYCHAIN_SERVICE, '-a', KEYCHAIN_ACCOUNT], { stdio: 'pipe' });
  } catch { /* not found, fine */ }

  execFileSync('security', ['add-generic-password', '-s', KEYCHAIN_SERVICE, '-a', KEYCHAIN_ACCOUNT, '-w', data], { stdio: 'pipe' });
}

function macLoad(): string | null {
  try {
    const result = execFileSync('security', ['find-generic-password', '-s', KEYCHAIN_SERVICE, '-a', KEYCHAIN_ACCOUNT, '-w'], {
      stdio: 'pipe',
      encoding: 'utf-8',
    });
    return result.trim();
  } catch {
    return null;
  }
}

function macClear(): boolean {
  try {
    execFileSync('security', ['delete-generic-password', '-s', KEYCHAIN_SERVICE, '-a', KEYCHAIN_ACCOUNT], { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

// ── Linux secret-tool (data via stdin, no shell interpolation) ────

function linuxSave(data: string): void {
  execSync(`secret-tool store --label="${KEYCHAIN_SERVICE}" service ${KEYCHAIN_SERVICE} account ${KEYCHAIN_ACCOUNT}`, {
    input: data,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
}

function linuxLoad(): string | null {
  try {
    const result = execFileSync('secret-tool', ['lookup', 'service', KEYCHAIN_SERVICE, 'account', KEYCHAIN_ACCOUNT], {
      stdio: 'pipe',
      encoding: 'utf-8',
    });
    return result.trim() || null;
  } catch {
    return null;
  }
}

function linuxClear(): boolean {
  try {
    execFileSync('secret-tool', ['clear', 'service', KEYCHAIN_SERVICE, 'account', KEYCHAIN_ACCOUNT], { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

// ── Encrypted file fallback ───────────────────────────────────────
// Uses a randomly generated key stored in a separate file with
// restrictive permissions. The key is created on first use.

function getOrCreateKey(): Buffer {
  ensureDir();
  if (existsSync(KEY_FILE)) {
    return readFileSync(KEY_FILE);
  }
  const key = randomBytes(KEY_LENGTH);
  writeFileSync(KEY_FILE, key, { mode: FILE_MODE });
  return key;
}

function deriveKey(): Buffer {
  const masterKey = getOrCreateKey();
  return scryptSync(KEY_DERIVATION_SALT, masterKey, KEY_LENGTH);
}

function encryptedSave(data: string): void {
  ensureDir();
  const key = deriveKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(data, 'utf-8'), cipher.final()]);
  const payload = Buffer.concat([iv, encrypted]);
  writeFileSync(FALLBACK_FILE, payload, { mode: FILE_MODE });
}

function encryptedLoad(): string | null {
  if (!existsSync(FALLBACK_FILE)) return null;
  try {
    const payload = readFileSync(FALLBACK_FILE);
    const key = deriveKey();
    const iv = payload.subarray(0, IV_LENGTH);
    const encrypted = payload.subarray(IV_LENGTH);
    const decipher = createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf-8');
  } catch {
    return null;
  }
}

function encryptedClear(): boolean {
  let cleared = false;
  if (existsSync(FALLBACK_FILE)) {
    unlinkSync(FALLBACK_FILE);
    cleared = true;
  }
  if (existsSync(KEY_FILE)) {
    unlinkSync(KEY_FILE);
    cleared = true;
  }
  return cleared;
}

// ── Helpers ───────────────────────────────────────────────────────

function ensureDir(): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true, mode: DIR_MODE });
  }
}

function useKeychain(): 'mac' | 'linux' | 'file' {
  if (isMacOS()) return 'mac';
  if (isLinux() && hasSecretTool()) return 'linux';
  return 'file';
}

// ── Public API ────────────────────────────────────────────────────

export function saveCredentials(creds: Credentials): void {
  const data = JSON.stringify(creds);
  const backend = useKeychain();

  if (backend === 'mac') {
    macSave(data);
  } else if (backend === 'linux') {
    linuxSave(data);
  } else {
    encryptedSave(data);
  }

  // Clean up any legacy plaintext file
  const legacyFile = join(CONFIG_DIR, CREDENTIALS_FILE);
  if (existsSync(legacyFile)) {
    unlinkSync(legacyFile);
  }
}

export function loadCredentials(): Credentials | null {
  const backend = useKeychain();
  let data: string | null = null;

  if (backend === 'mac') {
    data = macLoad();
  } else if (backend === 'linux') {
    data = linuxLoad();
  } else {
    data = encryptedLoad();
  }

  // Try legacy plaintext file if keychain has nothing
  if (!data) {
    const legacyFile = join(CONFIG_DIR, CREDENTIALS_FILE);
    if (existsSync(legacyFile)) {
      try {
        const creds = JSON.parse(readFileSync(legacyFile, 'utf-8')) as Credentials;
        // Migrate to secure storage
        saveCredentials(creds);
        unlinkSync(legacyFile);
        return creds;
      } catch {
        return null;
      }
    }
    return null;
  }

  try {
    return JSON.parse(data) as Credentials;
  } catch {
    return null;
  }
}

export function clearCredentials(): boolean {
  const backend = useKeychain();
  let cleared = false;

  if (backend === 'mac') {
    cleared = macClear();
  } else if (backend === 'linux') {
    cleared = linuxClear();
  } else {
    cleared = encryptedClear();
  }

  // Also clean up any legacy file
  const legacyFile = join(CONFIG_DIR, CREDENTIALS_FILE);
  if (existsSync(legacyFile)) {
    unlinkSync(legacyFile);
    cleared = true;
  }

  return cleared;
}

export function getToken(): string | null {
  const creds = loadCredentials();
  return creds?.token ?? null;
}

export function getCredentialBackend(): string {
  return useKeychain();
}
