import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { AppList } from '@/components/AppList';
import { ButtonGuide } from '@/components/ButtonGuide';
import { Icon } from '@/components/Icon';
import { MusicSection } from '@/components/MusicSection';
import { NotificationList } from '@/components/NotificationList';
import { SettingsSection } from '@/components/SettingsSection';
import { AppFace } from '@/components/tiles/AppFace';
import { ClockFace } from '@/components/tiles/ClockFace';
import { MusicFace } from '@/components/tiles/MusicFace';
import { NotesFace } from '@/components/tiles/NotesFace';
import { Tile } from '@/components/tiles/Tile';
import { VolumeBar } from '@/components/VolumeBar';
import { useArtColor } from '@/hooks/useArtColor';
import { useDrag } from '@/hooks/useDrag';
import { useInput } from '@/hooks/useInput';
import { useLauncher } from '@/hooks/useLauncher';
import { useLiveTiles } from '@/hooks/useLiveTiles';
import { useNow } from '@/hooks/useNow';
import { HINGE, LIVE_TILES, MARGIN, PRESETS, SCREEN, SECTIONS, type Section } from '@/lib/constants';
import { pack } from '@/lib/layout';
import { noteStops } from '@/lib/notifications';
import { applyTheme } from '@/lib/theme';
import { formatTime } from '@/lib/time';
import { gridWidth, labelOf, startTiles } from '@/lib/tiles';
import { clamp, wait } from '@/lib/util';

export default function App() {
  const launcher = useLauncher();
  const { theme, accent } = launcher.theme;
  useEffect(() => applyTheme({ theme, accent }), [theme, accent]);

  const strip = useRef<HTMLDivElement>(null);
  const [focus, setFocus] = useState(0);
  const [offset, setOffset] = useState(0);
  const [section, setSection] = useState<Section>('start');
  const [leaving, setLeaving] = useState(false);
  const flipped = useLiveTiles(LIVE_TILES);
  const artColor = useArtColor(launcher.nowPlaying?.artUrl ?? null);
  const now = useNow();

  const placed = useMemo(
    () => pack(startTiles(launcher.apps ?? [])).sort((a, b) => a.col - b.col || a.row - b.row),
    [launcher.apps],
  );

  const items = () => Array.from(strip.current?.querySelectorAll<HTMLElement>('[data-focus]') ?? []);
  const maxOffset = () => Math.max(0, (strip.current?.scrollWidth ?? 0) - SCREEN + 2 * MARGIN);

  // a section with nothing to focus (an empty notifications page) is still scrolled to, so a jump never goes nowhere
  const focusSection = (s: Section) => {
    const i = items().findIndex(el => el.closest<HTMLElement>('[data-section]')?.dataset.section === s);
    if (i >= 0) return setFocus(i);
    const root = strip.current;
    const host = root?.querySelector<HTMLElement>(`[data-section="${s}"]`);
    if (!root || !host) return;
    setSection(s);
    setOffset(clamp(host.getBoundingClientRect().left - root.getBoundingClientRect().left, 0, maxOffset()));
  };

  // entering a section snaps to its start; within one, keep the focused element inside the margins
  useLayoutEffect(() => {
    const el = items()[focus];
    const root = strip.current;
    const host = el?.closest<HTMLElement>('[data-section]');
    if (!el || !root || !host) return;
    const origin = root.getBoundingClientRect().left;
    const left = el.getBoundingClientRect().left - origin;
    const right = left + el.offsetWidth;
    const s = host.dataset.section as Section;
    const entered = s !== section;
    setOffset(o => {
      let next = entered ? host.getBoundingClientRect().left - origin : o;
      if (right - next > SCREEN - 2 * MARGIN) next = right - (SCREEN - 2 * MARGIN);
      if (left - next < 0) next = left;
      return clamp(next, 0, maxOffset());
    });
    setSection(s);
  }, [focus, placed.length]);

  const launch = async (id: string) => {
    if (leaving) return;
    const visible = Array.from(strip.current?.querySelectorAll<HTMLElement>('.tile, .app-row') ?? []).filter(el => {
      const r = el.getBoundingClientRect();
      return r.right > 0 && r.left < SCREEN;
    });
    visible.forEach((el, i) => {
      el.style.transformOrigin = `${HINGE - el.getBoundingClientRect().left}px 50%`;
      el.style.setProperty('--d', `${i * 40}ms`);
    });
    setLeaving(true);
    try {
      await wait(250 + visible.length * 40);
      await launcher.launch(id);
      // activation swaps the page on a device; if it refused or this is mock mode, the screen comes back
      await wait(600);
    } finally {
      // the leaving state hides every tile, so it must never outlive a failed launch
      for (const el of visible) {
        el.style.transformOrigin = '';
        el.style.removeProperty('--d');
      }
      setLeaving(false);
    }
  };

  // turnstile in once the tiles exist, then drop the hinge so presses scale from the centre
  const [entering, setEntering] = useState(true);
  const loaded = launcher.apps !== null;
  useEffect(() => {
    if (!loaded) return;
    const t = window.setTimeout(() => setEntering(false), 400 + placed.length * 50);
    return () => window.clearTimeout(t);
  }, [loaded]);

  useInput({
    // with music_knob=volume the knob is volume on music, like the stock car thing; back or a preset leaves
    step: d =>
      section === 'music' && launcher.musicKnob === 'volume'
        ? launcher.stepVolume(d)
        : setFocus(f => clamp(f + d, 0, items().length - 1)),
    press: () => items()[focus]?.click(),
    back: () => section !== 'start' && focusSection('start'),
    // M flips between start and music: from start it jumps to the player, from anywhere else back to the clock tile
    home: () => {
      if (section === 'start') return focusSection('music');
      setSection('start');
      setFocus(0);
      setOffset(0);
    },
    preset: n => (n === 4 ? launcher.togglePlay() : focusSection(PRESETS[n])),
    hold: n => setGuide({ n, at: Date.now() }),
  });

  // after a drag, focus the first fully visible item so the section title, dots and the next knob turn follow
  // the finger. setting the section first stops the focus effect from snapping back to a section start.
  const settle = (o: number) => {
    setOffset(o);
    const root = strip.current;
    if (!root) return;
    const origin = root.getBoundingClientRect().left;
    const all = items();
    const i = all.findIndex(el => {
      const left = el.getBoundingClientRect().left - origin;
      return left - o >= 0 && left + el.offsetWidth - o <= SCREEN - 2 * MARGIN;
    });
    if (i < 0) return;
    const s = all[i].closest<HTMLElement>('[data-section]')?.dataset.section as Section | undefined;
    if (s) setSection(s);
    setFocus(i);
  };
  const drag = useDrag(strip, offset, maxOffset, settle);

  // the manifest turns the system volume bar off for this launcher, so it shows its own WP-style flyout instead.
  const [flyout, setFlyout] = useState(false);
  // a held preset shows the button guide for 2.5 s; `at` re-arms the timer on every hold
  const [guide, setGuide] = useState<{ n: number; at: number } | null>(null);
  useEffect(() => {
    if (!guide) return;
    const t = window.setTimeout(() => setGuide(null), 2500);
    return () => window.clearTimeout(t);
  }, [guide]);
  const { level, muted } = launcher.volume ?? {};
  // every change re-arms the hide timer
  useEffect(() => {
    if (level === undefined) return;
    setFlyout(true);
    const t = window.setTimeout(() => setFlyout(false), 1500);
    return () => window.clearTimeout(t);
  }, [level, muted]);
  const focusOf = (el: HTMLElement) => setFocus(items().indexOf(el));
  const appCount = launcher.apps?.length ?? 0;
  const stops = noteStops(launcher.notes);
  // music's knob stops: play/pause alone in volume mode, all three controls in scroll mode
  const musicStops = launcher.musicKnob === 'scroll' ? 3 : 1;

  return (
    <div className="screen">
      <header className="status">
        <span className="status-title">{section}</span>
        <span>{formatTime(now, launcher.time)}</span>
      </header>

      {guide && <ButtonGuide held={guide.n} />}

      {!guide && flyout && launcher.volume && (
        <div className="flyout" role="status">
          <VolumeBar volume={launcher.volume} />
        </div>
      )}

      <div
        ref={strip}
        className={`strip${leaving ? ' leaving' : ''}${entering && loaded ? ' entering' : ''}`}
        style={{ transform: `translateX(${-offset}px)` }}
        {...drag.handlers}>
        <section data-section="start" className="start" style={{ width: gridWidth(placed) }}>
          {placed.map((t, i) => (
            <Tile
              key={t.key}
              index={i}
              col={t.col}
              row={t.row}
              w={t.w}
              h={t.h}
              focused={focus === i}
              label={labelOf(t)}
              background={t.kind === 'music' ? artColor : undefined}
              onPress={el => {
                if (drag.moved) return;
                // tiles that open a section jump without focusing themselves first: that focus would snap the strip
                // back to start, which wins whenever the target section has nothing focusable
                if (t.kind === 'music') return focusSection('music');
                if (t.kind === 'notes') return focusSection('notifications');
                if (t.kind === 'settings') return focusSection('settings');
                focusOf(el);
                if (t.kind === 'app') void launch(t.app.id);
              }}>
              {t.kind === 'clock' && <ClockFace now={now} time={launcher.time} flipped={flipped === 'clock'} />}
              {t.kind === 'music' && <MusicFace launcher={launcher} peek={flipped === 'music'} />}
              {t.kind === 'notes' && <NotesFace notes={launcher.notes} flipped={flipped === 'notes'} />}
              {t.kind === 'app' && <AppFace app={t.app} size={t.size} />}
              {t.kind === 'settings' && (
                <span className="app-glyph">
                  <Icon name="settings" size={44} />
                </span>
              )}
            </Tile>
          ))}
        </section>

        <NotificationList
          notes={launcher.notes}
          now={now}
          focusedIndex={focus - placed.length}
          onAct={(el, id, action) => {
            if (drag.moved) return;
            focusOf(el);
            launcher.act(id, action);
          }}
          onClear={() => {
            if (drag.moved) return;
            launcher.clearNotes();
            focusSection('start');
          }}
        />

        <AppList
          apps={launcher.apps ?? []}
          focusedIndex={focus - placed.length - stops}
          onPress={(el, id) => {
            if (drag.moved) return;
            focusOf(el);
            void launch(id);
          }}
        />

        <MusicSection launcher={launcher} focusedIndex={focus - placed.length - stops - appCount} />

        <SettingsSection
          device={launcher.device}
          theme={launcher.theme}
          onPickTheme={launcher.pickTheme}
          focusedIndex={focus - placed.length - stops - appCount - musicStops}
          onFocus={focusOf}
        />
      </div>

      <div className="dots" aria-hidden="true">
        {SECTIONS.map(s => (
          <i key={s} className={s === section ? 'on' : undefined} />
        ))}
      </div>
    </div>
  );
}
