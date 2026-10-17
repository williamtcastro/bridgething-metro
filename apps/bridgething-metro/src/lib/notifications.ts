import type { Notification } from '@bridgething/client';

import { appName } from '@/lib/app-names';
import type { Note } from '@/types';

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
