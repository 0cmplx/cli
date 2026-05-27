export const R = '\x1b[0m';
export const DIM = '\x1b[2m';
export const BOLD = '\x1b[1m';
export const W = '\x1b[97m';
export const GREY = '\x1b[90m';
export const GREEN = '\x1b[32m';
export const CYAN = '\x1b[36m';
export const RED = '\x1b[31m';
export const YELLOW = '\x1b[33m';
export const D = '\x1b[38;5;240m';

export const TICK = '\u2713';
export const CROSS = '\u2717';
export const DOT = '\u00b7';
export const ARROW = '\u203a';

export const noColor =
  process.argv.includes('--no-color') || !!process.env.NO_COLOR;

function c(code: string, msg: string): string {
  return noColor ? msg : `${code}${msg}${R}`;
}

export function ok(msg: string): void {
  console.log(c(GREEN, `  ${TICK} ${msg}`));
}

export function fail(msg: string): void {
  console.error(c(RED, `  ${CROSS} ${msg}`));
}

export function warn(msg: string): void {
  console.log(c(YELLOW, `  ! ${msg}`));
}

export function dim(msg: string): string {
  return c(DIM, msg);
}

export function heading(msg: string): void {
  console.log('');
  console.log(c(`${W}${BOLD}`, `  ${msg}`));
  console.log('');
}
