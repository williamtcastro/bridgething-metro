import type { Notification } from '@bridgething/client';

import { appName } from '@/lib/app-names';
import type { Note } from '@/types';

const DISMISSED_KEY = 'metro-dismissed';
const DISMISSED_MAX = 200;

// notifications the user cleared here. the daemon replays what it still holds on every connect, and a clear only
// reaches the phone when it offered a negative action, so without this a reload brings cleared ones back.
// newest last, capped, in page storage (it only has to outlive reloads, not the device).
export function dismissedIds(): Set<string> {
  try {
    const v = JSON.parse(localStorage.getItem(DISMISSED_KEY) ?? '[]');
    return new Set(Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string') : []);
  } catch {
    return new Set();
  }
}

export function dismiss(ids: string[]) {
  const all = [...dismissedIds(), ...ids];
  try {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify([...new Set(all)].slice(-DISMISSED_MAX)));
  } catch {
    // storage unavailable: the clear still applies until the next reload
  }
}

export function toNote(n: Notification): Note {
  return {
    id: n.id,
    app: n.app.displayName ?? appName(n.app.bundleId),
    title: n.title ?? n.subtitle ?? '',
    body: n.message ?? '',
    time: n.timestampUnixS,
    positive: n.positiveAction?.label ?? null,
    negative: n.negativeAction?.label ?? null,
  };
}

// minutes for recent ones, a clock time for today's, a short date otherwise
export function noteTime(unixS: number | null, now: Date) {
  if (unixS === null) return '';
  const at = new Date(unixS * 1000);
  const mins = Math.floor((now.getTime() - at.getTime()) / 60_000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  if (at.toDateString() === now.toDateString()) {
    return at.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
  }
  return at.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }).toLowerCase();
}

// knob stops the list contributes: "clear all" plus each note's actions
export function noteStops(notes: Note[]) {
  if (notes.length === 0) return 0;
  return 1 + notes.reduce((n, note) => n + (note.positive ? 1 : 0) + (note.negative ? 1 : 0), 0);
}
