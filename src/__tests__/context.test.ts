import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  resolveContext,
  requireApp,
  requireSchema,
  findProjectContext,
} from '../infrastructure/context.js';
import { CONFIG_DIR_NAME, CONTEXT_FILE } from '../domain/constants.js';

describe('resolveContext', () => {
  it('returns flag source when --app is provided', () => {
    const ctx = resolveContext({ app: 'app_123' });
    expect(ctx.app).toBe('app_123');
    expect(ctx.source).toBe('flag');
  });

  it('returns flag source when --schema is provided', () => {
    const ctx = resolveContext({ schema: 'sch_456' });
    expect(ctx.schema).toBe('sch_456');
    expect(ctx.source).toBe('flag');
  });

  it('ignores boolean flag values', () => {
    const ctx = resolveContext({ app: true });
    // Boolean true is not a string, so it should not be picked up as flag override
    expect(ctx.app).not.toBe('true');
  });

  it('returns null source when nothing is set', () => {
    const ctx = resolveContext({});
    expect(ctx.source).toBeNull();
    expect(ctx.app).toBeNull();
    expect(ctx.schema).toBeNull();
  });
});

describe('requireApp', () => {
  it('returns app when set', () => {
    expect(requireApp({ app: 'app_x', schema: null, source: 'flag' })).toBe('app_x');
  });

  it('throws helpful error when no app', () => {
    expect(() => requireApp({ app: null, schema: null, source: null })).toThrow(
      /No app selected/,
    );
  });
});

describe('requireSchema', () => {
  it('returns schema when set', () => {
    expect(requireSchema({ app: null, schema: 'sch_y', source: 'flag' })).toBe('sch_y');
  });

  it('throws helpful error when no schema', () => {
    expect(() => requireSchema({ app: null, schema: null, source: null })).toThrow(
      /No schema selected/,
    );
  });
});

describe('findProjectContext', () => {
  const testDir = join(tmpdir(), `0cmplx-test-${Date.now()}`);
  const nestedDir = join(testDir, 'a', 'b', 'c');
  const originalCwd = process.cwd();

  beforeEach(() => {
    mkdirSync(nestedDir, { recursive: true });
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(testDir, { recursive: true, force: true });
  });

  it('finds context in current directory', () => {
    const ctxDir = join(testDir, CONFIG_DIR_NAME);
    mkdirSync(ctxDir, { recursive: true });
    writeFileSync(join(ctxDir, CONTEXT_FILE), JSON.stringify({ app: 'app_here' }));

    process.chdir(testDir);
    const result = findProjectContext();
    expect(result?.app).toBe('app_here');
  });

  it('walks up directories to find context', () => {
    const ctxDir = join(testDir, CONFIG_DIR_NAME);
    mkdirSync(ctxDir, { recursive: true });
    writeFileSync(join(ctxDir, CONTEXT_FILE), JSON.stringify({ app: 'app_parent' }));

    process.chdir(nestedDir);
    const result = findProjectContext();
    expect(result?.app).toBe('app_parent');
  });

  it('returns null when no context found', () => {
    process.chdir(nestedDir);
    const result = findProjectContext();
    expect(result).toBeNull();
  });
});
