import { MARGIN } from '@/lib/constants';
import { px, type Size } from '@/lib/layout';
import type { AppEntry, StartLayout } from '@/types';

export type TileSpec =
  | { key: string; size: Size; kind: 'clock' }
  | { key: string; size: Size; kind: 'music' }
  | { key: string; size: Size; kind: 'notes' }
  | { key: string; size: Size; kind: 'settings' }
  | { key: string; size: Size; kind: 'app'; app: AppEntry };

// the 2x2 block of small tiles beside the clock holds three apps and settings; packing fills it column by column,
// so settings lands beside the second app (weather, on a stock install)
function defaultTiles(apps: AppEntry[]): TileSpec[] {
  const appTiles = apps.map(
    (app, i): TileSpec => ({ key: app.id, kind: 'app', app, size: i < 3 ? 'small' : 'medium' }),
  );
  return [
    { key: 'clock', kind: 'clock', size: 'medium' },
    { key: 'music', kind: 'music', size: 'wide' },
    ...appTiles.slice(0, 3),
    { key: 'settings', kind: 'settings', size: 'small' },
    { key: 'notes', kind: 'notes', size: 'wide' },
    ...appTiles.slice(3),
  ];
}

// the defaults reshaped by the saved layout: hidden ones dropped, ordered ones first in their saved order, the
// rest (new apps included) after them in default order, and each size kept only if the tile allows it
export function startTiles(apps: AppEntry[], layout: StartLayout): TileSpec[] {
  const hidden = new Set(layout.hidden);
  const tiles = defaultTiles(apps).filter(t => !hidden.has(t.key));
  const rank = new Map(layout.order.map((k, i) => [k, i]));
  const ordered = tiles
    .filter(t => rank.has(t.key))
    .sort((a, b) => (rank.get(a.key) ?? 0) - (rank.get(b.key) ?? 0));
  return [...ordered, ...tiles.filter(t => !rank.has(t.key))].map(t => {
    const size = layout.sizes[t.key];
    return size && allowedSizes(t).includes(size) ? { ...t, size } : t;
  });
}

// the clock, music and notification faces need room; settings is a glyph; apps take any size
export function allowedSizes(t: TileSpec): Size[] {
  if (t.kind === 'clock' || t.kind === 'music' || t.kind === 'notes') return ['medium', 'wide'];
  if (t.kind === 'settings') return ['small', 'medium'];
  return ['small', 'medium', 'wide'];
}

export type CatalogTile = { key: string; name: string; size: Size; sizes: Size[] };

// every tile the start grid can show, in default order with its default and allowed sizes, for the companion's
// tile list (the `tiles` doc)
export function tileCatalog(apps: AppEntry[]): CatalogTile[] {
  return defaultTiles(apps).map(t => ({ key: t.key, name: tileName(t), size: t.size, sizes: allowedSizes(t) }));
}

function tileName(t: TileSpec) {
  if (t.kind === 'clock') return 'clock';
  if (t.kind === 'music') return 'now playing';
  if (t.kind === 'notes') return 'notifications';
  if (t.kind === 'settings') return 'settings';
  return t.app.name.toLowerCase();
}

export function labelOf(t: TileSpec): string | undefined {
  if (t.size === 'small' || t.kind === 'music') return undefined;
  return tileName(t);
}

export function gridWidth(placed: { col: number; w: number }[]) {
  const cols = placed.reduce((m, t) => Math.max(m, t.col + t.w), 0);
  return px(cols) + MARGIN;
}
