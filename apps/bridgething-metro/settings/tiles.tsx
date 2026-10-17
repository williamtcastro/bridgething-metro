import { settings } from '@bridgething/client/settings';
import { useEffect, useRef, useState } from 'react';

type Size = 'small' | 'medium' | 'wide';
type CatalogTile = { key: string; name: string; size: Size; sizes: Size[] };
type StartLayout = { order: string[]; sizes: Record<string, Size>; hidden: string[] };

const SIZES: Size[] = ['small', 'medium', 'wide'];
const EMPTY: StartLayout = { order: [], sizes: {}, hidden: [] };

// dev-only: `?sample` renders without a host
const SAMPLE = new URLSearchParams(location.search).has('sample');
const SAMPLE_CATALOG: CatalogTile[] = [
  { key: 'clock', name: 'clock', size: 'medium', sizes: ['medium', 'wide'] },
  { key: 'music', name: 'now playing', size: 'wide', sizes: ['medium', 'wide'] },
  { key: 'weather', name: 'weather', size: 'small', sizes: ['small', 'medium', 'wide'] },
  { key: 'settings', name: 'settings', size: 'small', sizes: ['small', 'medium'] },
  { key: 'notes', name: 'notifications', size: 'wide', sizes: ['medium', 'wide'] },
];
const SAMPLE_LAYOUT: StartLayout = { order: ['music', 'clock'], sizes: { weather: 'medium' }, hidden: ['notes'] };

// mirrors src/lib/start-layout.ts parseLayout: tolerant of anything another writer left behind
function parseLayout(raw: string | null | undefined): StartLayout {
  if (!raw) return EMPTY;
  try {
    const v = JSON.parse(raw) as Partial<StartLayout>;
    const strings = (a: unknown) => (Array.isArray(a) ? a.filter((s): s is string => typeof s === 'string') : []);
    const sizes: Record<string, Size> = {};
    for (const [k, s] of Object.entries(v.sizes ?? {})) if (SIZES.includes(s as Size)) sizes[k] = s as Size;
    return { order: strings(v.order), sizes, hidden: strings(v.hidden) };
  } catch {
    return EMPTY;
  }
}

function parseCatalog(raw: string | null | undefined): CatalogTile[] | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw);
    if (!Array.isArray(v)) return null;
    const tiles = v.filter(
      (t): t is CatalogTile =>
        !!t && typeof t.key === 'string' && typeof t.name === 'string' && Array.isArray(t.sizes),
    );
    return tiles.length ? tiles : null;
  } catch {
    return null;
  }
}

// ordered keys first in their saved order, the rest after in catalog order
function effective(catalog: CatalogTile[], layout: StartLayout): CatalogTile[] {
  const rank = new Map(layout.order.map((k, i) => [k, i]));
  const ordered = catalog
    .filter(t => rank.has(t.key))
    .sort((a, b) => (rank.get(a.key) ?? 0) - (rank.get(b.key) ?? 0));
  return [...ordered, ...catalog.filter(t => !rank.has(t.key))];
}

export function TilesSection() {
  const [catalog, setCatalog] = useState<CatalogTile[] | null>(SAMPLE ? SAMPLE_CATALOG : null);
  const [layout, setLayout] = useState<StartLayout>(SAMPLE ? SAMPLE_LAYOUT : EMPTY);
  const [status, setStatus] = useState('');
  const latest = useRef(layout);
  latest.current = layout;

  useEffect(() => {
    if (SAMPLE) return;
    (async () => {
      try {
        const [tiles, lay] = await Promise.all([settings.doc.get('tiles'), settings.doc.get('layout')]);
        setCatalog(parseCatalog(tiles.value));
        setLayout(parseLayout(lay.value));
      } catch {
        // no host: the section shows the hint
      }
    })();
    try {
      return settings.onDocChanged((key, value) => {
        if (key === 'tiles') setCatalog(parseCatalog(value));
        if (key === 'layout') setLayout(parseLayout(value));
      });
    } catch {
      return undefined;
    }
  }, []);

  // read-modify-write from the latest state, optimistic
  async function write(update: (l: StartLayout) => StartLayout) {
    const next = update(latest.current);
    latest.current = next;
    setLayout(next);
    if (SAMPLE) return;
    try {
      await settings.doc.set('layout', JSON.stringify(next));
      setStatus('');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : String(err));
    }
  }

  if (!catalog) return (
    <>
      <h2>tiles</h2>
      <p className="hint">open Metro on your Car Thing once to list its tiles</p>
    </>
  );

  const rows = effective(catalog, layout);
  const hidden = new Set(layout.hidden);

  const toggle = (key: string) =>
    write(l => ({ ...l, hidden: l.hidden.includes(key) ? l.hidden.filter(k => k !== key) : [...l.hidden, key] }));
  const resize = (key: string, size: Size) => write(l => ({ ...l, sizes: { ...l.sizes, [key]: size } }));
  const move = (key: string, by: -1 | 1) =>
    write(l => {
      const keys = effective(catalog, l).map(t => t.key);
      const i = keys.indexOf(key);
      const j = i + by;
      if (j < 0 || j >= keys.length) return l;
      [keys[i], keys[j]] = [keys[j], keys[i]];
      return { ...l, order: keys };
    });

  return (
    <>
      <h2>tiles</h2>
      <ul className="tiles">
        {rows.map((t, i) => {
          const off = hidden.has(t.key);
          const size = layout.sizes[t.key] && t.sizes.includes(layout.sizes[t.key]) ? layout.sizes[t.key] : t.size;
          return (
            <li key={t.key} className={off ? 'tile off' : 'tile'}>
              <div className="tile-head">
                <span className="tile-name">{t.name}</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={!off}
                  aria-label={`Show ${t.name}`}
                  className="switch"
                  onClick={() => toggle(t.key)}
                >
                  <span className="switch-label">{off ? 'off' : 'on'}</span>
                  <span className="switch-track">
                    <i />
                  </span>
                </button>
              </div>
              <div className="tile-tools">
                {t.sizes.length > 1 ? (
                  <div className="sizes" role="radiogroup" aria-label={`${t.name} size`}>
                    {t.sizes.map(s => (
                      <button
                        key={s}
                        type="button"
                        role="radio"
                        aria-checked={size === s}
                        className="size"
                        onClick={() => resize(t.key, s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                ) : (
                  <span />
                )}
                <div className="moves">
                  <button
                    type="button"
                    className="move"
                    aria-label={`Move ${t.name} up`}
                    disabled={i === 0}
                    onClick={() => move(t.key, -1)}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="move"
                    aria-label={`Move ${t.name} down`}
                    disabled={i === rows.length - 1}
                    onClick={() => move(t.key, 1)}
                  >
                    ↓
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <button type="button" className="reset" onClick={() => write(() => EMPTY)}>
        reset layout
      </button>
      <p className="status">{status}</p>
    </>
  );
}
