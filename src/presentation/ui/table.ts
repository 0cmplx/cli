import { DIM, R, noColor } from './ansi.js';

export interface Column {
  key: string;
  label: string;
  align?: 'left' | 'right';
  maxWidth?: number;
}

function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max - 1) + '\u2026';
}

function pad(str: string, width: number, align: 'left' | 'right'): string {
  if (align === 'right') return str.padStart(width);
  return str.padEnd(width);
}

export function printTable(
  columns: Column[],
  rows: Record<string, unknown>[],
): void {
  if (rows.length === 0) {
    console.log('  No results.');
    return;
  }

  // Calculate column widths
  const widths = columns.map((col) => {
    const maxData = rows.reduce((max, row) => {
      const val = String(row[col.key] ?? '');
      return Math.max(max, val.length);
    }, 0);
    const natural = Math.max(col.label.length, maxData);
    return col.maxWidth ? Math.min(natural, col.maxWidth) : natural;
  });

  // Header
  const header = columns
    .map((col, i) => pad(col.label, widths[i], col.align ?? 'left'))
    .join('  ');
  const headerLine = noColor ? `  ${header}` : `  ${DIM}${header}${R}`;
  console.log(headerLine);

  // Rows
  for (const row of rows) {
    const line = columns
      .map((col, i) => {
        let val = String(row[col.key] ?? '');
        if (col.maxWidth) val = truncate(val, col.maxWidth);
        return pad(val, widths[i], col.align ?? 'left');
      })
      .join('  ');
    console.log(`  ${line}`);
  }
}
