import { MARGIN } from '@/lib/constants';
import { px, type Size } from '@/lib/layout';
import type { AppEntry } from '@/types';

export type TileSpec =
  | { key: string; size: Size; kind: 'clock' }
  | { key: string; size: Size; kind: 'music' }
  | { key: string; size: Size; kind: 'notes' }
  | { key: string; size: Size; kind: 'settings' }
  | { key: string; size: Size; kind: 'app'; app: AppEntry };

// the 2x2 block of small tiles beside the clock holds three apps and settings; packing fills it column by column,
// so settings lands beside the second app (weather, on a stock install)
export function startTiles(apps: AppEntry[]): TileSpec[] {
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

export function labelOf(t: TileSpec): string | undefined {
  if (t.size === 'small' || t.kind === 'music') return undefined;
  if (t.kind === 'clock') return 'clock';
  if (t.kind === 'notes') return 'notifications';
  if (t.kind === 'settings') return 'settings';
  return t.app.name.toLowerCase();
}

export function gridWidth(placed: { col: number; w: number }[]) {
  const cols = placed.reduce((m, t) => Math.max(m, t.col + t.w), 0);
  return px(cols) + MARGIN;
}
