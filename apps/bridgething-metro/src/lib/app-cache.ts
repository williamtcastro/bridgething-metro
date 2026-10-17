import type { AppEntry } from '@/types';

const CACHE_KEY = 'metro-apps';

// names and ids only: icons are blob urls that die with the page, so they fill in once the daemon answers
export function cachedApps(): AppEntry[] | null {
  try {
    const v = JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null') as { id: string; name: string }[] | null;
    if (!Array.isArray(v)) return null;
    return v
      .filter(a => typeof a?.id === 'string' && typeof a?.name === 'string')
      .map(a => ({ id: a.id, name: a.name, iconUrl: null }));
  } catch {
    return null;
  }
}

export function cacheApps(apps: AppEntry[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(apps.map(a => ({ id: a.id, name: a.name }))));
  } catch {
    // storage can be unavailable; the next load just waits for the daemon
  }
}
