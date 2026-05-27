import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { homedir, platform } from 'os';
import { execSync } from 'child_process';
import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';
import type { Credentials } from '../domain/types.js';

const SERVICE = '0cmplx';
const ACCOUNT = 'cli-credentials';
const CONFIG_DIR = join(homedir(), '.0cmplx');
const FALLBACK_FILE = join(CONFIG_DIR, 'credentials.enc');

// ── Keychain backends ─────────────────────────────────────────────

function isMacOS(): boolean {
  return platform() === 'darwin';
}

function isLinux(): boolean {
  return platform() === 'linux';
}

function hasSecretTool(): boolean {
  try {
    execSync('which secret-tool', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

// ── macOS Keychain ────────────────────────────────────────────────

function macSave(data: string): void {
  // Delete existing entry first (ignore errors if not found)
  try {
    execSync(`security delete-generic-password -s "${SERVICE}" -a "${ACCOUNT}"`, { stdio: 'pipe' });
  } catch { /* not found, fine */ }

  execSync(
    `security add-generic-password -s "${SERVICE}" -a "${ACCOUNT}" -w "${data.replace(/"/g, '\\"')}"`,
    { stdio: 'pipe' },
  );
}

function macLoad(): string | null {
  try {
    const result = execSync(
      `security find-generic-password -s "${SERVICE}" -a "${ACCOUNT}" -w`,
      { stdio: 'pipe', encoding: 'utf-8' },
    );
    return result.trim();
  } catch {
    return null;
  }
}

function macClear(): boolean {
  try {
    execSync(`security delete-generic-password -s "${SERVICE}" -a "${ACCOUNT}"`, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

// ── Linux secret-tool (libsecret/GNOME Keyring) ──────────────────

function linuxSave(data: string): void {
  execSync(
    `echo -n "${data.replace(/"/g, '\\"')}" | secret-tool store --label="${SERVICE}" service "${SERVICE}" account "${ACCOUNT}"`,
    { stdio: 'pipe', shell: '/bin/sh' },
  );
}

function linuxLoad(): string | null {
  try {
    const result = execSync(
      `secret-tool lookup service "${SERVICE}" account "${ACCOUNT}"`,
      { stdio: 'pipe', encoding: 'utf-8' },
    );
    return result.trim() || null;
  } catch {
    return null;
  }
}

function linuxClear(): boolean {
  try {
    execSync(
      `secret-tool clear service "${SERVICE}" account "${ACCOUNT}"`,
      { stdio: 'pipe' },
    );
    return true;
  } catch {
    return false;
  }
}

// ── Encrypted file fallback ───────────────────────────────────────
// Uses a machine-derived key (hostname + username hash) so the file
// is not portable but also not plaintext. This is the last resort
// when no OS keychain is available.

function deriveKey(): Buffer {
  const material = `${homedir()}:${process.env.USER || 'unknown'}:0cmplx-cli`;
  return createHash('sha256').update(material).digest();
}

function encryptedSave(data: string): void {
  ensureDir();
  const key = deriveKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-cbc', key, iv);
  const encrypted = Buffer.concat([cipher.update(data, 'utf-8'), cipher.final()]);
  const payload = Buffer.concat([iv, encrypted]);
  writeFileSync(FALLBACK_FILE, payload, { mode: 0o600 });
}

function encryptedLoad(): string | null {
  if (!existsSync(FALLBACK_FILE)) return null;
  try {
    const payload = readFileSync(FALLBACK_FILE);
    const key = deriveKey();
    const iv = payload.subarray(0, 16);
    const encrypted = payload.subarray(16);
    const decipher = createDecipheriv('aes-256-cbc', key, iv);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf-8');
  } catch {
    return null;
  }
}

function encryptedClear(): boolean {
  if (!existsSync(FALLBACK_FILE)) return false;
  unlinkSync(FALLBACK_FILE);
  return true;
}

// ── Helpers ───────────────────────────────────────────────────────

function ensureDir(): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
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
  const legacyFile = join(CONFIG_DIR, 'credentials.json');
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
    const legacyFile = join(CONFIG_DIR, 'credentials.json');
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
  const legacyFile = join(CONFIG_DIR, 'credentials.json');
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
