import { describe, it, expect } from 'vitest';
import { relativeTime, fileSize, coverageBar, shortId } from '../presentation/ui/format.js';

describe('relativeTime', () => {
  it('formats just now', () => {
    const now = new Date().toISOString();
    expect(relativeTime(now)).toBe('just now');
  });

  it('formats minutes ago', () => {
    const d = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(relativeTime(d)).toBe('5m ago');
  });

  it('formats hours ago', () => {
    const d = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    expect(relativeTime(d)).toBe('3h ago');
  });

  it('formats days ago', () => {
    const d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    expect(relativeTime(d)).toBe('7d ago');
  });

  it('formats months ago', () => {
    const d = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
    expect(relativeTime(d)).toBe('2mo ago');
  });
});

describe('fileSize', () => {
  it('formats bytes', () => {
    expect(fileSize(512)).toBe('512 B');
  });

  it('formats kilobytes', () => {
    expect(fileSize(4300)).toBe('4.2 KB');
  });

  it('formats megabytes', () => {
    expect(fileSize(2 * 1024 * 1024)).toBe('2.0 MB');
  });

  it('handles zero', () => {
    expect(fileSize(0)).toBe('0 B');
  });
});

describe('coverageBar', () => {
  it('renders 100% coverage', () => {
    const bar = coverageBar(10, 0);
    expect(bar).toContain('100%');
  });

  it('renders 0% coverage', () => {
    const bar = coverageBar(10, 10);
    expect(bar).toContain('0%');
  });

  it('renders partial coverage', () => {
    const bar = coverageBar(10, 1);
    expect(bar).toContain('90%');
  });

  it('handles zero total', () => {
    const bar = coverageBar(0, 0);
    expect(bar).toContain('0%');
  });
});

describe('shortId', () => {
  it('strips prefix', () => {
    expect(shortId('sch_abc123')).toBe('abc123');
  });

  it('returns full id if no prefix', () => {
    expect(shortId('nounderscore')).toBe('nounderscore');
  });

  it('handles multiple underscores', () => {
    expect(shortId('srv_foo_bar')).toBe('foo_bar');
  });
});
