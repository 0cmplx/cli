// Brand
export const CLI_NAME = '0cmplx';
export const CLI_BIN = '0cmplx';

// Paths
export const CONFIG_DIR_NAME = '.0cmplx';
export const CREDENTIALS_FILE = 'credentials.json'; // legacy
export const CONTEXT_FILE = 'context.json';
export const KEY_FILE = '.key';
export const ENCRYPTED_CREDENTIALS_FILE = 'credentials.enc';

// Keychain
export const KEYCHAIN_SERVICE = '0cmplx';
export const KEYCHAIN_ACCOUNT = 'cli-credentials';

// Crypto
export const ENCRYPTION_ALGORITHM = 'aes-256-cbc';
export const KEY_DERIVATION_SALT = '0cmplx-cli';
export const KEY_LENGTH = 32;
export const IV_LENGTH = 16;

// API
export const DEFAULT_API_URL = 'https://api.0cmplx.com';
export const FETCH_TIMEOUT = 30_000;
export const AUTH_TIMEOUT = 15_000;
export const TOKEN_PREFIX = '0cx_';

// File permissions
export const DIR_MODE = 0o700;   // rwx------
export const FILE_MODE = 0o600;  // rw-------

// ID patterns
export const ID_PATTERN = /^[a-zA-Z0-9_-]+$/;
