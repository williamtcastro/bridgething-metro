import type { TimeInfo } from '@bridgething/client';

export function formatTime(now: Date, time: TimeInfo | null) {
  return format(now, time, { hour: '2-digit', minute: '2-digit', hour12: false });
}

// the phone reports locales as `en_US` and may send a zone this chromium lacks; either makes Intl throw
// mid-render, which blanks the whole launcher. fall back step by step instead.
export function format(now: Date, time: TimeInfo | null, opts: Intl.DateTimeFormatOptions) {
  const locale = time?.locale?.replace(/_/g, '-');
  const timeZone = time?.tzIana ?? undefined;
  for (const [l, tz] of [
    [locale, timeZone],
    [undefined, timeZone],
    [undefined, undefined],
  ]) {
    try {
      return new Intl.DateTimeFormat(l, { ...opts, timeZone: tz }).format(now);
    } catch {
      // try the next, looser combination
    }
  }
  return '';
}
