import type { IconName } from '@/components/Icon';

// Metro tiles are flat accent with a white glyph, so the bridgething system and catalog apps get one instead of
// their own coloured icon. keyed by lowercase app name; anything else keeps its icon.
const GLYPHS: Record<string, IconName> = {
  browser: 'globe',
  calendar: 'calendar',
  'home assistant': 'home',
  maps: 'map',
  podcasts: 'mic',
  settings: 'settings',
  spotify: 'spotify',
  'system info': 'info',
  'voice debug': 'mic',
  weather: 'weather',
};

export function appGlyph(name: string): IconName | null {
  return GLYPHS[name.trim().toLowerCase()] ?? null;
}

// the playing phone app, when it has a mark of its own
export function sourceGlyph(source: string | null): IconName {
  return source?.toLowerCase() === 'spotify' ? 'spotify' : 'music';
}
