import type { TimeInfo } from '@bridgething/client';

import type { Size } from '@/lib/layout';
import type { Theme } from '@/lib/theme';
import type { Weather } from '@/lib/weather';

export type AppEntry = { id: string; name: string; iconUrl: string | null };
export type NowPlaying = { title: string; artist: string | null; album: string | null; source: string | null; artUrl: string | null; playing: boolean };
// positive / negative are the phone's own action labels (e.g. "Reply" / "Clear"), null when it offers none
export type Note = {
  id: string;
  app: string;
  title: string;
  body: string;
  time: number | null;
  positive: string | null;
  negative: string | null;
};
// level is 0.0 to 1.0
export type Volume = { level: number; muted: boolean };

// the start grid as the user shaped it, shared with the companion through the `layout` doc. order and sizes come
// from edit mode on the device, hidden from the companion settings page. keys are tile keys (`clock`, app ids...);
// a key missing from order keeps its default slot after the ordered ones.
export type StartLayout = { order: string[]; sizes: Record<string, Size>; hidden: string[] };
export const EMPTY_LAYOUT: StartLayout = { order: [], sizes: {}, hidden: [] };

// level is 0.0 to 1.0
export type Brightness = { mode: 'auto' | 'manual'; level: number };
export type PairedPhone = { mac: string; name: string; connected: boolean };

export type DeviceSettings = {
  brightness: Brightness | null;
  phones: PairedPhone[];
  version: string | null;
  setBrightnessMode(mode: Brightness['mode']): void;
  stepBrightness(direction: number): void;
  connect(mac: string): void;
  reboot(): void;
};

export type Launcher = {
  device: DeviceSettings;
  layout: StartLayout;
  saveLayout(layout: StartLayout): void;
  // null until the first forecast arrives (or a cached one is loaded)
  weather: Weather | null;
  apps: AppEntry[] | null;
  nowPlaying: NowPlaying | null;
  notes: Note[];
  time: TimeInfo | null;
  theme: Theme;
  // picked on the device; overrides the companion value until the companion changes it again
  pickTheme(patch: Partial<Theme>): void;
  // null until the daemon reports a change; there is no volume getter
  volume: Volume | null;
  stepVolume(direction: number): void;
  // manifest `music_knob`: the knob turns volume on the music section, or keeps navigating there
  musicKnob: 'volume' | 'scroll';
  // runs a notification's action on the phone; the negative one also drops it here without waiting for the echo
  act(id: string, action: 'positive' | 'negative'): void;
  clearNotes(): void;
  launch(id: string): Promise<void>;
  togglePlay(): void;
  next(): void;
  prev(): void;
};
