import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';
import type { ResolvedContext } from '../domain/types.js';
import { CONFIG_DIR_NAME, CONTEXT_FILE, DIR_MODE } from '../domain/constants.js';
import { ContextError, ERRORS } from '../domain/errors.js';

const GLOBAL_DIR = join(homedir(), CONFIG_DIR_NAME);
const GLOBAL_CONTEXT_FILE = join(GLOBAL_DIR, CONTEXT_FILE);

export function resolveContext(
  flags: Record<string, string | string[] | boolean>,
): ResolvedContext {
  // 1. Flag override
  const flagApp = typeof flags.app === 'string' ? flags.app : null;
  const flagSchema = typeof flags.schema === 'string' ? flags.schema : null;

  if (flagApp || flagSchema) {
    return {
      app: flagApp,
      schema: flagSchema,
      source: 'flag',
    };
  }

  // 2. Project context
  const project = findProjectContext();
  if (project && (project.app || project.schema)) {
    return {
      app: project.app ?? null,
      schema: project.schema ?? null,
      source: 'project',
    };
  }

  // 3. Global context
  const global = loadGlobalContext();
  if (global.activeApp || global.activeSchema) {
    return {
      app: global.activeApp ?? null,
      schema: global.activeSchema ?? null,
      source: 'global',
    };
  }

  return { app: null, schema: null, source: null };
}

export function requireApp(ctx: ResolvedContext): string {
  if (!ctx.app) {
    throw new ContextError(ERRORS.NO_APP_CONTEXT);
  }
  return ctx.app;
}

export function requireSchema(ctx: ResolvedContext): string {
  if (!ctx.schema) {
    throw new ContextError(ERRORS.NO_SCHEMA_CONTEXT);
  }
  return ctx.schema;
}

export function saveGlobalContext(
  key: 'activeApp' | 'activeSchema',
  value: string,
): void {
  if (!existsSync(GLOBAL_DIR)) {
    mkdirSync(GLOBAL_DIR, { recursive: true, mode: DIR_MODE });
  }
  const current = loadGlobalContext();
  current[key] = value;
  writeFileSync(GLOBAL_CONTEXT_FILE, JSON.stringify(current, null, 2));
}

export function loadGlobalContext(): {
  activeApp?: string;
  activeSchema?: string;
} {
  if (!existsSync(GLOBAL_CONTEXT_FILE)) return {};
  try {
    return JSON.parse(readFileSync(GLOBAL_CONTEXT_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

export function initProjectContext(app?: string, schema?: string): void {
  const dir = join(process.cwd(), CONFIG_DIR_NAME);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  const data: Record<string, string> = {};
  if (app) data.app = app;
  if (schema) data.schema = schema;
  writeFileSync(join(dir, CONTEXT_FILE), JSON.stringify(data, null, 2));
}

export function findProjectContext(): {
  app?: string;
  schema?: string;
} | null {
  let dir = process.cwd();

  while (true) {
    const candidate = join(dir, CONFIG_DIR_NAME, CONTEXT_FILE);
    if (existsSync(candidate)) {
      try {
        return JSON.parse(readFileSync(candidate, 'utf-8'));
      } catch {
        return null;
      }
    }

    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  return null;
}
