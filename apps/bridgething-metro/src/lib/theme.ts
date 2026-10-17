// the WP8 accent set; names match the manifest `accent` enum choices
export const ACCENTS: Record<string, string> = {
  lime: '#a4c400',
  green: '#60a917',
  emerald: '#008a00',
  teal: '#00aba9',
  cyan: '#1ba1e2',
  cobalt: '#0050ef',
  indigo: '#6a00ff',
  violet: '#aa00ff',
  pink: '#f472d0',
  magenta: '#d80073',
  crimson: '#a20025',
  red: '#e51400',
  orange: '#fa6800',
  amber: '#f0a30a',
  yellow: '#e3c800',
  brown: '#825a2c',
  olive: '#6d8764',
  steel: '#647687',
  mauve: '#76608a',
  sienna: '#a0522d',
};

export type Theme = { theme: 'dark' | 'light'; accent: string };

export const DEFAULT_THEME: Theme = { theme: 'dark', accent: 'cyan' };

const CACHE_KEY = 'metro-theme';

// every applied theme is remembered in the page's own storage, which is synchronous, so the next load can paint
// it before the first frame. the daemon config stays the source of truth; this only bridges the wait for it.
export function applyTheme({ theme, accent }: Theme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.setProperty('--accent', ACCENTS[accent] ?? ACCENTS[DEFAULT_THEME.accent]);
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ theme, accent }));
  } catch {
    // storage can be unavailable; the next load just starts on the default
  }
}

export function cachedTheme(): Theme | null {
  try {
    const v = JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null') as Theme | null;
    if (v && (v.theme === 'dark' || v.theme === 'light') && v.accent in ACCENTS) return v;
  } catch {
    // unreadable cache counts as none
  }
  return null;
}
