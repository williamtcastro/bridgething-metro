import { useMemo, useState } from 'react';

import { DEFAULT_THEME, type Theme } from '@/lib/theme';
import type { Brightness, Launcher, Note } from '@/types';

// stand-in album art so the artwork path is exercised without a phone
function mockArt(from: string, to: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"><defs><linearGradient id="g" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="300" height="300" fill="url(#g)"/><circle cx="150" cy="150" r="70" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="6"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const MOCK_APPS = ['Calendar', 'Weather', 'Home Assistant', 'System Info', 'Voice Debug', 'Browser', 'Podcasts', 'Maps'];
// built once: a fresh array per render would re-pack the start grid on every render
const APPS = MOCK_APPS.map((name, i) => ({ id: `mock-${i}`, name, iconUrl: null }));

export function useMockLauncher(enabled: boolean): Launcher {
  const [playing, setPlaying] = useState(true);
  const [trackNo, setTrackNo] = useState(0);
  const [level, setLevel] = useState(0.5);
  const [notes, setNotes] = useState<Note[]>(() => {
    const now = Math.floor(Date.now() / 1000);
    return [
      { id: 'n1', app: 'Messages', title: 'Ana', body: 'running 10 minutes late, save me a seat', time: now - 120, positive: 'Reply', negative: 'Clear' },
      { id: 'n2', app: 'Calendar', title: 'Standup', body: 'in 15 minutes', time: now - 900, positive: null, negative: 'Clear' },
      { id: 'n3', app: 'Mail', title: 'Your order shipped', body: 'arriving friday', time: now - 7200, positive: 'Archive', negative: 'Clear' },
    ];
  });
  const [brightness, setBrightness] = useState<Brightness>({ mode: 'auto', level: 0.6 });
  const q = useMemo(() => new URLSearchParams(location.search), []);
  const [theme, setTheme] = useState<Theme>(() => ({
    theme: q.get('theme') === 'light' ? 'light' : 'dark',
    accent: q.get('accent') ?? DEFAULT_THEME.accent,
  }));
  const tracks = [
    { title: 'Midnight City', artist: 'M83', album: 'Hurry Up, We Are Dreaming', art: ['#3a1c71', '#d76d77'] },
    { title: 'Digital Love', artist: 'Daft Punk', album: 'Discovery', art: ['#0f2027', '#2c5364'] },
    { title: 'Breathe', artist: null, album: null, art: ['#614385', '#516395'] },
  ];
  const { art, ...track } = tracks[(((trackNo % tracks.length) + tracks.length) % tracks.length)];
  return {
    device: {
      brightness,
      phones: [
        { mac: '98:0D:AF:00:00:01', name: 'iPhone', connected: true },
        { mac: '98:0D:AF:00:00:02', name: 'Pixel', connected: false },
      ],
      version: '0.13.1',
      setBrightnessMode: mode => setBrightness(b => ({ ...b, mode })),
      stepBrightness: d =>
        setBrightness(b => ({ mode: 'manual', level: Math.min(1, Math.max(0.1, Math.round((b.level + Math.sign(d) * 0.1) * 10) / 10)) })),
      connect: mac => console.info('[metro] connect', mac),
      reboot: () => console.info('[metro] reboot'),
    },
    apps: enabled ? APPS : null,
    nowPlaying: { ...track, source: 'Spotify', artUrl: mockArt(art[0], art[1]), playing },
    notes,
    act: (id, action) => {
      console.info('[metro] notification', action, id);
      if (action === 'negative') setNotes(ns => ns.filter(n => n.id !== id));
    },
    clearNotes: () => setNotes([]),
    // shaped like what an iPhone sends, underscore locale included
    time: {
      tzIana: 'America/Sao_Paulo',
      locale: 'en_US',
      wallClockUnixS: null,
      utcOffsetMinutes: null,
      dstOffsetMinutes: null,
    },
    theme,
    pickTheme: patch => setTheme(t => ({ ...t, ...patch })),
    volume: { level, muted: false },
    musicKnob: q.get('knob') === 'scroll' ? 'scroll' : 'volume',
    stepVolume: d => setLevel(l => Math.min(1, Math.max(0, Math.round((l + Math.sign(d) / 16) * 16) / 16))),
    async launch(id) {
      console.info('[metro] launch', id);
    },
    togglePlay: () => setPlaying(p => !p),
    next: () => setTrackNo(n => n + 1),
    prev: () => setTrackNo(n => n - 1),
  };
}
