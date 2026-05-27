import { GREEN, GREY, R, noColor } from './ansi.js';

export function relativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = now - then;

  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export function fileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

export function coverageBar(found: number, failed: number): string {
  const total = found;
  const passed = found - failed;
  const pct = total === 0 ? 0 : Math.round((passed / total) * 100);

  const width = 10;
  const filled = Math.round((pct / 100) * width);
  const empty = width - filled;

  if (noColor) {
    return `${'#'.repeat(filled)}${'.'.repeat(empty)} ${pct}%`;
  }

  const bar = `${GREEN}${'█'.repeat(filled)}${R}${GREY}${'░'.repeat(empty)}${R}`;
  return `${bar} ${pct}%`;
}

export function shortId(id: string): string {
  const idx = id.indexOf('_');
  if (idx === -1) return id;
  return id.slice(idx + 1);
}
