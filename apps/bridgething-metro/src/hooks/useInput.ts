import { useEffect, useRef } from 'react';

import { WHEEL_STEP } from '@/lib/constants';

const HOLD_MS = 500;

// the knob arrives as a horizontal wheel; desktop mice send deltaY, so accept either
export function useInput(on: {
  step(d: number): void;
  press(): void;
  back(): void;
  home(): void;
  preset(n: number): void;
  // a preset held past HOLD_MS; fires once per hold
  hold(n: number): void;
}) {
  const latest = useRef(on);
  latest.current = on;
  useEffect(() => {
    // focus only shows while driving by knob or buttons; a touch hides it, as WP never drew focus under a finger
    const mode = (m: 'knob' | 'touch') => (document.documentElement.dataset.input = m);
    mode('knob');
    const touch = () => mode('touch');
    let acc = 0;
    const wheel = (e: WheelEvent) => {
      mode('knob');
      acc += Math.abs(e.deltaX) >= Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      while (Math.abs(acc) >= WHEEL_STEP) {
        latest.current.step(Math.sign(acc));
        acc -= Math.sign(acc) * WHEEL_STEP;
      }
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Enter') latest.current.press();
      else if (e.key === 'Escape') latest.current.back();
      // the M button. the daemon only watches it (read-only) for its 5-press / hold return-home gesture, so the page
      // still gets every press; on the launcher a single one goes to start, which the gesture would do anyway
      else if (e.key === 'm' || e.key === 'M') latest.current.home();
      else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') latest.current.step(1);
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') latest.current.step(-1);
      else if (e.key >= '1' && e.key <= '4') {
        // the press acts at once and a hold only adds the guide, so presets still work if keyup never arrives.
        // auto-repeat keydowns are ignored, or holding 4 would toggle play/pause over and over.
        if (!e.repeat) {
          const n = Number(e.key);
          latest.current.preset(n);
          window.clearTimeout(held);
          held = window.setTimeout(() => latest.current.hold(n), HOLD_MS);
        }
      } else return;
      mode('knob');
      e.preventDefault();
    };
    let held = 0;
    const release = (e: KeyboardEvent) => {
      if (e.key >= '1' && e.key <= '4') window.clearTimeout(held);
    };
    window.addEventListener('wheel', wheel, { passive: true });
    window.addEventListener('keydown', key);
    window.addEventListener('keyup', release);
    window.addEventListener('pointerdown', touch, { capture: true, passive: true });
    return () => {
      window.clearTimeout(held);
      window.removeEventListener('wheel', wheel);
      window.removeEventListener('keydown', key);
      window.removeEventListener('keyup', release);
      window.removeEventListener('pointerdown', touch, { capture: true });
    };
  }, []);
}
