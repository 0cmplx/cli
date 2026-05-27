import { createSpinner } from '../ui/spinner.js';
import { fail } from '../ui/ansi.js';

type Flags = Record<string, string | string[] | boolean>;

// Standard command runner that handles errors, JSON output, and spinners
export async function runCommand<T>(opts: {
  spinner: string;
  action: () => Promise<T>;
  onSuccess: (result: T, flags: Flags) => void;
  flags: Flags;
}): Promise<void> {
  const s = createSpinner(opts.spinner).start();
  try {
    const result = await opts.action();
    s.succeed();
    if (opts.flags.json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }
    opts.onSuccess(result, opts.flags);
  } catch (err) {
    s.fail(err instanceof Error ? err.message : 'Operation failed');
    process.exit(1);
  }
}

// Helper to get a required positional arg or exit with usage
export function requireArg(args: string[], index: number, usage: string): string {
  const value = args[index];
  if (!value) {
    fail(`Usage: ${usage}`);
    process.exit(2);
  }
  return value;
}

// Helper to get a string flag value
export function getFlag(flags: Flags, key: string): string | undefined {
  const v = flags[key];
  return typeof v === 'string' ? v : undefined;
}
