import type { NowPlaying } from '@/types';

// non-music phone apps often send a title and nothing else; name the app rather than leave the line empty
export function byline(np: NowPlaying) {
  if (np.artist) return np.artist;
  return np.source ? `via ${np.source.toLowerCase()}` : '';
}

export function initial(name: string) {
  return (name.trim().charAt(0) || '#').toUpperCase();
}

export function clamp(n: number, lo: number, hi: number) {
  return Math.min(Math.max(n, lo), hi);
}

export function wait(ms: number) {
  return new Promise(r => window.setTimeout(r, ms));
}

// the daemon wants a real uuid, but crypto.randomUUID only exists in secure contexts and `dev:device`
// serves the kiosk over plain http. getRandomValues works everywhere, so build a v4 from it.
export function requestId() {
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, x => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
