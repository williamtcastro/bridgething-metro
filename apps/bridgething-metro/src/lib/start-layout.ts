import type { Size } from '@/lib/layout';
import { EMPTY_LAYOUT, type StartLayout } from '@/types';

// docs shared with the companion settings page: the launcher writes the catalog, both sides write the layout
export const LAYOUT_DOC = 'layout';
export const TILES_DOC = 'tiles';
const CACHE_KEY = 'metro-layout';
const SIZES: Size[] = ['small', 'medium', 'wide'];

// tolerant of anything the companion or an older build wrote: unknown fields and bad values are dropped
export function parseLayout(raw: string | null | undefined): StartLayout {
  if (!raw) return EMPTY_LAYOUT;
  try {
    const v = JSON.parse(raw) as Partial<StartLayout>;
    const strings = (a: unknown) => (Array.isArray(a) ? a.filter((s): s is string => typeof s === 'string') : []);
    const sizes: Record<string, Size> = {};
    for (const [k, s] of Object.entries(v.sizes ?? {})) if (SIZES.includes(s as Size)) sizes[k] = s as Size;
    return { order: strings(v.order), sizes, hidden: strings(v.hidden) };
  } catch {
    return EMPTY_LAYOUT;
  }
}

// like the theme, the last layout is kept in page storage so a reload draws the user's grid straight away
export function cachedLayout(): StartLayout | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? parseLayout(raw) : null;
  } catch {
    return null;
  }
}

export function cacheLayout(layout: StartLayout) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(layout));
  } catch {
    // storage can be unavailable; the doc is still the source of truth
  }
}
