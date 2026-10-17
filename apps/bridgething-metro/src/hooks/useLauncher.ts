import { BridgethingClient, type PlayerState, type TimeInfo } from '@bridgething/client';
import { useEffect, useMemo, useRef, useState } from 'react';

import { daemonUrl } from '@/daemon';
import { toNote } from '@/lib/notifications';
import { applyDelta, keepKnown } from '@/lib/player';
import { ACCENTS, cachedTheme, DEFAULT_THEME, type Theme } from '@/lib/theme';
import { requestId } from '@/lib/util';
import type { AppEntry, Launcher, Note, Volume } from '@/types';
import { useDevice } from './useDevice';
import { useMockLauncher } from './useMockLauncher';

// `?mock` runs on sample data: `just dev-daemon` has no phone, so player, time and notifications stay empty there
export function useLauncher(): Launcher {
  const mock = useMemo(() => new URLSearchParams(location.search).has('mock'), []);
  const live = useLive(!mock);
  const fake = useMockLauncher(mock);
  return mock ? fake : live;
}

const THEME_KEY = 'theme_override';

// only keys the picker writes, and only values the launcher knows, survive a stored override
function parseLocal(raw: string): Partial<Theme> {
  try {
    const v = JSON.parse(raw) as Partial<Theme>;
    const out: Partial<Theme> = {};
    if (v.theme === 'dark' || v.theme === 'light') out.theme = v.theme;
    if (typeof v.accent === 'string' && v.accent in ACCENTS) out.accent = v.accent;
    return out;
  } catch {
    return {};
  }
}

function useLive(enabled: boolean): Launcher {
  const client = useMemo(() => (enabled ? new BridgethingClient({ url: daemonUrl() }) : null), [enabled]);
  const [apps, setApps] = useState<AppEntry[] | null>(null);
  const [player, setPlayer] = useState<PlayerState | null>(null);
  // the playing phone app; stands in when the track has no artist (non-music apps often send title only)
  const [source, setSource] = useState<string | null>(null);
  const [artUrl, setArtUrl] = useState<string | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [time, setTime] = useState<TimeInfo | null>(null);
  // starts on the last theme actually shown, so a reload never flashes the default before config arrives
  const [theme, setTheme] = useState<Theme>(() => cachedTheme() ?? DEFAULT_THEME);
  // a theme picked on the device itself. webapps can only read companion config, so it lives in the device store
  // and wins until the companion changes that same setting again
  const [local, setLocal] = useState<Partial<Theme>>({});
  const [volume, setVolume] = useState<Volume | null>(null);
  const [musicKnob, setMusicKnob] = useState<'volume' | 'scroll'>('volume');
  const device = useDevice(client);

  useEffect(() => {
    if (!client) return;
    let cancelled = false;
    const revoke: string[] = [];

    const loadApps = async () => {
      const [list, current] = await Promise.all([client.webapp.list(), client.webapp.current()]);
      if (!list.ok) return;
      const selfId = current.ok ? current.response.id : null;
      const loaded = await Promise.all(
        list.response.webapps
          .filter(w => w.id !== selfId)
          .map(async (info): Promise<AppEntry> => {
            if (!info.iconHash) return { id: info.id, name: info.name, iconUrl: null };
            const icon = await client.webapp.icon({ id: info.id });
            if (!icon.ok) return { id: info.id, name: info.name, iconUrl: null };
            const bytes = new Uint8Array(icon.response.bytes as unknown as number[]);
            const url = URL.createObjectURL(new Blob([bytes], { type: icon.response.mime ?? 'image/png' }));
            revoke.push(url);
            return { id: info.id, name: info.name, iconUrl: url };
          }),
      );
      if (!cancelled) setApps(loaded);
    };

    const config: Record<string, string> = {};
    const pushTheme = () => {
      setTheme({
        theme: config.theme === 'light' ? 'light' : 'dark',
        accent: config.accent ?? DEFAULT_THEME.accent,
      });
      setMusicKnob(config.music_knob === 'scroll' ? 'scroll' : 'volume');
    };

    // the socket drops and reconnects on its own; pull everything again on each open so nothing stays stale
    const refresh = () => {
      void loadApps();
      // companion config and the device-picked override land in one update: applied one after the other, the
      // companion colour showed for a moment before the override replaced it
      void Promise.all([client.config.list(), client.store.get({ key: THEME_KEY })]).then(([cfg, stored]) => {
        if (cfg.ok) {
          for (const e of cfg.response.entries) config[e.key] = e.value;
          pushTheme();
        }
        if (stored.ok) setLocal(stored.response.value ? parseLocal(stored.response.value) : {});
      });
      void client.player.stateGet().then(r => {
        if (!r.ok) return;
        setPlayer(p => keepKnown(p, r.response.state));
        setSource(r.response.activeApp?.name ?? null);
      });
      void client.time.get().then(r => r.ok && setTime(r.response.time));
    };
    refresh();

    const offs = [
      client.on(e => e.type === 'open' && refresh()),
      // artwork usually lands after the track, as a delta rather than a snapshot
      client.player.onDelta(d => setPlayer(p => (p ? applyDelta(p, d) : p))),
      client.webapp.onWebappInstalled(() => void loadApps()),
      client.webapp.onWebappUninstalled(() => void loadApps()),
      client.config.onChanged(c => {
        if (c.value === null) delete config[c.key];
        else config[c.key] = c.value;
        pushTheme();
        if (c.key === 'theme' || c.key === 'accent') {
          setLocal(l => {
            const next = { ...l };
            delete next[c.key as keyof Theme];
            void client.store.put({ key: THEME_KEY, value: JSON.stringify(next) });
            return next;
          });
        }
      }),
      client.player.onSnapshot(s => {
        setPlayer(p => keepKnown(p, s.state));
        setSource(s.activeApp?.name ?? null);
      }),
      client.time.onSnapshot(s => setTime(s.time)),
      client.time.onChanged(s => setTime(s.time)),
      client.notifications.onPosted(n => setNotes(ns => [toNote(n), ...ns.filter(x => x.id !== n.id)])),
      client.notifications.onUpdated(n => setNotes(ns => ns.map(x => (x.id === n.id ? toNote(n) : x)))),
      client.notifications.onRemoved(r => setNotes(ns => ns.filter(x => x.id !== r.id))),
      client.audio.onVolumeChanged(v => setVolume({ level: v.level, muted: v.muted })),
    ];

    return () => {
      cancelled = true;
      for (const off of offs) off();
      for (const url of revoke) URL.revokeObjectURL(url);
    };
  }, [client]);

  // the shown image stays up until its replacement has loaded, so a slow or failed fetch never blanks it
  const shown = useRef<string | null>(null);
  const swapArt = (url: string | null) => {
    if (shown.current && shown.current !== url) URL.revokeObjectURL(shown.current);
    shown.current = url;
    setArtUrl(url);
  };
  useEffect(() => () => swapArt(null), []);

  // the phone can still be sending the image when the id arrives, so retry at 1, 2 and 4 s
  const artworkId = player?.track?.artworkId ?? null;
  useEffect(() => {
    if (!client) return;
    if (!artworkId) {
      swapArt(null);
      return;
    }
    let stale = false;
    void (async () => {
      for (let attempt = 0; attempt < 4; attempt++) {
        if (attempt > 0) await new Promise(r => window.setTimeout(r, 1000 * 2 ** (attempt - 1)));
        if (stale) return;
        const r = await client.asset
          .get({ id: artworkId, requestId: requestId() }, { timeoutMs: 10_000 })
          .catch(() => null);
        if (stale) return;
        if (!r?.ok) continue;
        // bytes arrive as a plain number array over the wire, not a Uint8Array
        const bytes = new Uint8Array(r.response.bytes as unknown as number[]);
        swapArt(URL.createObjectURL(new Blob([bytes], { type: r.response.mime ?? 'image/jpeg' })));
        return;
      }
    })();
    return () => {
      stale = true;
    };
  }, [client, artworkId]);

  const track = player?.track;
  const playing = player?.playback.state === 'playing';
  return {
    device,
    apps,
    nowPlaying: track?.title
      ? { title: track.title, artist: track.artist ?? track.albumArtist, album: track.album, source, artUrl, playing }
      : null,
    notes,
    time,
    theme: { ...theme, ...local },
    pickTheme(patch) {
      setLocal(l => {
        const next = { ...l, ...patch };
        void client?.store.put({ key: THEME_KEY, value: JSON.stringify(next) });
        return next;
      });
    },
    volume,
    musicKnob,
    stepVolume(direction) {
      if (!client) return;
      void (direction > 0 ? client.audio.volumeUp() : client.audio.volumeDown());
    },
    act(id, action) {
      if (!client) return;
      void (action === 'positive' ? client.notifications.invokePositive({ id }) : client.notifications.invokeNegative({ id }));
      if (action === 'negative') setNotes(ns => ns.filter(n => n.id !== id));
    },
    clearNotes() {
      if (!client) return;
      for (const n of notes) if (n.negative) void client.notifications.invokeNegative({ id: n.id });
      setNotes([]);
    },
    async launch(id) {
      await client?.webapp.activate({ id });
    },
    togglePlay() {
      if (!client) return;
      void (playing ? client.player.pause() : client.player.resume());
    },
    next() {
      void client?.player.skipNext();
    },
    prev() {
      void client?.player.skipPrev({ allowSeeking: true });
    },
  };
}
