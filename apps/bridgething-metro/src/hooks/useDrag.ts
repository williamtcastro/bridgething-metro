import { useRef, type MouseEvent, type PointerEvent, type RefObject } from 'react';

import { clamp } from '@/lib/util';

// touch pans the strip by writing its transform directly, so a drag never re-renders react.
// release flings on with the last ~100ms of velocity, then commits the offset once.
// a drag past 8px swallows the click that ends it.
export function useDrag(
  strip: RefObject<HTMLDivElement | null>,
  offset: number,
  maxOffset: () => number,
  commit: (o: number) => void,
) {
  const s = useRef<{ x0: number; o0: number; o: number; moved: boolean; samples: [number, number][] } | null>(null);
  const swallow = useRef(false);

  const move = (o: number) => {
    if (strip.current) strip.current.style.transform = `translateX(${-o}px)`;
  };

  return {
    get moved() {
      return swallow.current;
    },
    handlers: {
      onPointerDown(e: PointerEvent) {
        s.current = { x0: e.clientX, o0: offset, o: offset, moved: false, samples: [[e.timeStamp, e.clientX]] };
        swallow.current = false;
      },
      onPointerMove(e: PointerEvent) {
        const d = s.current;
        if (!d) return;
        const dx = e.clientX - d.x0;
        if (!d.moved) {
          if (Math.abs(dx) < 8) return;
          d.moved = true;
          swallow.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          if (strip.current) strip.current.style.transition = 'none';
        }
        d.o = clamp(d.o0 - dx, 0, maxOffset());
        d.samples.push([e.timeStamp, e.clientX]);
        if (d.samples.length > 6) d.samples.shift();
        move(d.o);
      },
      onPointerUp(e: PointerEvent) {
        const d = s.current;
        s.current = null;
        if (!d?.moved) return;
        const [t0, x0] = d.samples.find(([t]) => e.timeStamp - t < 100) ?? d.samples[0];
        const dt = Math.max(1, e.timeStamp - t0);
        const velocity = (e.clientX - x0) / dt;
        const target = clamp(d.o - velocity * 300, 0, maxOffset());
        if (strip.current) strip.current.style.transition = '';
        move(target);
        commit(target);
      },
      onPointerCancel() {
        const d = s.current;
        s.current = null;
        if (strip.current) strip.current.style.transition = '';
        if (d?.moved) commit(d.o);
      },
      // runs before the tile's onClick, so a drag never launches an app
      onClickCapture(e: MouseEvent) {
        if (!swallow.current) return;
        swallow.current = false;
        e.stopPropagation();
      },
    },
  };
}
