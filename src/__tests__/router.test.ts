import { describe, it, expect } from 'vitest';
import { parseArgs, findCommand } from '../router.js';
import type { Command } from '../router.js';

describe('parseArgs', () => {
  it('parses positional args', () => {
    const { positionals, flags } = parseArgs(['schema', 'upload', 'file.sql']);
    expect(positionals).toEqual(['schema', 'upload', 'file.sql']);
    expect(flags).toEqual({});
  });

  it('parses --key value flags', () => {
    const { positionals, flags } = parseArgs(['schema', '--name', 'ecommerce']);
    expect(positionals).toEqual(['schema']);
    expect(flags).toEqual({ name: 'ecommerce' });
  });

  it('parses boolean flags', () => {
    const { positionals, flags } = parseArgs(['logs', '--follow', '--json']);
    expect(positionals).toEqual(['logs']);
    expect(flags).toEqual({ follow: true, json: true });
  });

  it('parses repeatable flags', () => {
    const { flags } = parseArgs(['exec', '--param', 'key=a', '--param', 'key=b']);
    expect(flags.param).toEqual(['key=a', 'key=b']);
  });

  it('handles -- separator', () => {
    const { positionals } = parseArgs(['--', '--not-a-flag']);
    expect(positionals).toEqual(['--not-a-flag']);
  });

  it('handles short flags', () => {
    const { flags } = parseArgs(['-h']);
    expect(flags.h).toBe(true);
  });

  it('handles mixed positionals and flags', () => {
    const { positionals, flags } = parseArgs([
      'server', 'install', 'srv_123', '--app', 'app_456', '--json',
    ]);
    expect(positionals).toEqual(['server', 'install', 'srv_123']);
    expect(flags).toEqual({ app: 'app_456', json: true });
  });
});

describe('findCommand', () => {
  const noop = async () => {};
  const commands: Command[] = [
    {
      name: 'schema',
      description: 'Manage schemas',
      subcommands: [
        { name: 'upload', description: 'Upload', run: noop },
        { name: 'list', description: 'List', run: noop },
      ],
      run: noop,
    },
    {
      name: 'auth',
      description: 'Authenticate',
      run: noop,
    },
  ];

  it('finds top-level command', () => {
    const { command, args } = findCommand(commands, ['auth']);
    expect(command?.name).toBe('auth');
    expect(args).toEqual([]);
  });

  it('finds subcommand', () => {
    const { command, args } = findCommand(commands, ['schema', 'upload', 'file.sql']);
    expect(command?.name).toBe('upload');
    expect(args).toEqual(['file.sql']);
  });

  it('returns parent when subcommand not found', () => {
    const { command, args } = findCommand(commands, ['schema', 'unknown']);
    expect(command?.name).toBe('schema');
    expect(args).toEqual(['unknown']);
  });

  it('returns null for unknown command', () => {
    const { command } = findCommand(commands, ['foobar']);
    expect(command).toBeNull();
  });

  it('returns null for empty positionals', () => {
    const { command } = findCommand(commands, []);
    expect(command).toBeNull();
  });

  it('returns remaining args after command match', () => {
    const { command, args } = findCommand(commands, ['auth', 'extra1', 'extra2']);
    expect(command?.name).toBe('auth');
    expect(args).toEqual(['extra1', 'extra2']);
  });
});
