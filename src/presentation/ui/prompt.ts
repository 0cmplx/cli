import { W, R, DIM } from './ansi.js';

export function confirm(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    process.stdout.write(`  ${message} ${DIM}[y/N]${R} `);

    const stdin = process.stdin;
    const wasRaw = stdin.isRaw;
    if (stdin.isTTY) stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf-8');

    const onData = (ch: string) => {
      stdin.removeListener('data', onData);
      if (stdin.isTTY) stdin.setRawMode(wasRaw ?? false);
      stdin.pause();
      process.stdout.write('\n');

      if (ch === '\u0003') {
        process.exit(1);
      }

      resolve(ch === 'y' || ch === 'Y');
    };

    stdin.on('data', onData);
  });
}

export interface InputOptions {
  hidden?: boolean;
}

export function input(
  message: string,
  opts?: InputOptions,
): Promise<string> {
  return new Promise((resolve) => {
    process.stdout.write(`  ${W}${message}${R} `);

    let buf = '';
    const stdin = process.stdin;
    const wasRaw = stdin.isRaw;
    if (stdin.isTTY) stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf-8');

    const onData = (ch: string) => {
      if (ch === '\n' || ch === '\r') {
        stdin.removeListener('data', onData);
        if (stdin.isTTY) stdin.setRawMode(wasRaw ?? false);
        stdin.pause();
        process.stdout.write('\n');
        resolve(buf.trim());
      } else if (ch === '\u0003') {
        process.exit(1);
      } else if (ch === '\u007f' || ch === '\b') {
        buf = buf.slice(0, -1);
        if (!opts?.hidden) {
          process.stdout.write('\b \b');
        }
      } else {
        buf += ch;
        if (!opts?.hidden) {
          process.stdout.write(ch);
        }
      }
    };

    stdin.on('data', onData);
  });
}
