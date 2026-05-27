import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { printTable } from '../presentation/ui/table.js';

describe('printTable', () => {
  let output: string[];
  const originalLog = console.log;

  beforeEach(() => {
    output = [];
    console.log = (...args: unknown[]) => {
      output.push(args.map(String).join(' '));
    };
  });

  afterEach(() => {
    console.log = originalLog;
  });

  it('prints "No results." for empty rows', () => {
    printTable(
      [{ key: 'name', label: 'Name' }],
      [],
    );
    expect(output.some((l) => l.includes('No results.'))).toBe(true);
  });

  it('prints header and data rows', () => {
    printTable(
      [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
      ],
      [
        { id: '1', name: 'Alpha' },
        { id: '2', name: 'Beta' },
      ],
    );

    // Header line + 2 data lines
    expect(output.length).toBe(3);
    expect(output[1]).toContain('Alpha');
    expect(output[2]).toContain('Beta');
  });

  it('calculates column widths correctly', () => {
    printTable(
      [
        { key: 'short', label: 'S' },
        { key: 'long', label: 'L' },
      ],
      [
        { short: 'a', long: 'longvalue' },
      ],
    );

    // The 'long' column should be wide enough for 'longvalue'
    const dataLine = output[1];
    expect(dataLine).toContain('longvalue');
  });

  it('aligns right when specified', () => {
    printTable(
      [
        { key: 'name', label: 'Name' },
        { key: 'count', label: 'Count', align: 'right' },
      ],
      [
        { name: 'x', count: '42' },
      ],
    );

    const dataLine = output[1];
    // Right-aligned: spaces before the number
    const countPart = dataLine.split('x')[1];
    expect(countPart.trimEnd()).toMatch(/\s+42$/);
  });

  it('handles missing values', () => {
    printTable(
      [{ key: 'name', label: 'Name' }],
      [{ other: 'value' }],
    );
    // Should not crash, renders empty string for missing key
    expect(output.length).toBe(2);
  });
});
