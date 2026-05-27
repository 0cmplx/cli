import { R, CYAN, GREEN, RED, TICK, CROSS, noColor } from './ansi.js';

const FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
const INTERVAL = 80;

export interface Spinner {
  succeed(text?: string): void;
  fail(text?: string): void;
  update(text: string): void;
}

export function createSpinner(msg: string): { start(): Spinner } {
  return {
    start(): Spinner {
      let i = 0;
      let text = msg;

      const write = (frame: string) => {
        process.stdout.write(`\r  ${frame} ${text}  `);
      };

      const timer = setInterval(() => {
        const frame = noColor ? '-' : `${CYAN}${FRAMES[i % FRAMES.length]}${R}`;
        write(frame);
        i++;
      }, INTERVAL);

      const stop = (symbol: string, finalText: string) => {
        clearInterval(timer);
        process.stdout.write(`\r  ${symbol} ${finalText}\x1b[K\n`);
      };

      return {
        succeed(t?: string) {
          const sym = noColor ? TICK : `${GREEN}${TICK}${R}`;
          stop(sym, t ?? text);
        },
        fail(t?: string) {
          const sym = noColor ? CROSS : `${RED}${CROSS}${R}`;
          stop(sym, t ?? text);
        },
        update(t: string) {
          text = t;
        },
      };
    },
  };
}
