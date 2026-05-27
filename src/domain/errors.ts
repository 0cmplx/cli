import { CLI_BIN, TOKEN_PREFIX } from './constants.js';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
  ) {
    super(code);
    this.name = 'ApiError';
  }
}

export class ContextError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ContextError';
  }
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Error messages as constants
export const ERRORS = {
  NOT_AUTHENTICATED: `Not authenticated. Run '${CLI_BIN} auth' to log in.`,
  INVALID_TOKEN: 'Invalid token.',
  INVALID_TOKEN_FORMAT: `Invalid token format. Tokens start with "${TOKEN_PREFIX}".`,
  NO_TOKEN_PROVIDED: 'No token provided.',
  EMPTY_SQL: 'SQL file is empty.',
  INVALID_SAMPLE: 'Unknown sample name.',
  NO_APP_CONTEXT: `No app selected. Use --app <id>, run "${CLI_BIN} use app <id>", or create a project context with "${CLI_BIN} init".`,
  NO_SCHEMA_CONTEXT: `No schema selected. Use --schema <id>, run "${CLI_BIN} use schema <id>", or create a project context with "${CLI_BIN} init".`,
} as const;
