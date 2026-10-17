import type { TimeInfo } from '@bridgething/client';

import { format, formatTime } from '@/lib/time';

import { Flip } from './Flip';

export function ClockFace({ now, time, flipped }: { now: Date; time: TimeInfo | null; flipped: boolean }) {
  const weekday = format(now, time, { weekday: 'long' }).toLowerCase();
  const day = format(now, time, { day: 'numeric' });
  const month = format(now, time, { month: 'long' }).toLowerCase();
  return (
    <Flip flipped={flipped}>
      <>
        <span className="clock-time">{formatTime(now, time)}</span>
        <span className="clock-day">
          {weekday} {day}
        </span>
      </>
      <>
        <span className="clock-time">{day}</span>
        <span className="clock-day">{month}</span>
      </>
    </Flip>
  );
}
