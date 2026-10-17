import { useRef, type CSSProperties, type ReactNode } from 'react';

import { HINGE, MARGIN } from '@/lib/constants';
import { px, STEP } from '@/lib/layout';

const LONG_PRESS_MS = 600;

export function Tile(props: {
  index: number;
  col: number;
  row: number;
  w: number;
  h: number;
  focused: boolean;
  label?: string;
  // replaces the accent, as the now playing tile does with its album colour
  background?: string | null;
  // edit mode: the tile being edited, and the move/resize buttons it carries
  selected?: boolean;
  controls?: ReactNode;
  onLongPress?(): void;
  onPress(el: HTMLElement): void;
  children: ReactNode;
}) {
  // a hold past LONG_PRESS_MS without moving fires onLongPress and swallows the click that ends it
  const hold = useRef<{ timer: number; x: number; y: number; fired: boolean } | null>(null);
  const cancel = () => {
    if (hold.current) window.clearTimeout(hold.current.timer);
  };

  const left = props.col * STEP;
  const style = {
    ...(props.background ? { background: props.background } : {}),
    left,
    top: props.row * STEP,
    width: px(props.w),
    height: px(props.h),
    '--i': props.index,
    '--origin': `${HINGE - MARGIN - left}px 50%`,
  } as CSSProperties;
  return (
    <button
      type="button"
      data-focus
      className={`tile${props.focused ? ' focused' : ''}${props.selected ? ' selected' : ''}`}
      style={style}
      onPointerDown={e => {
        cancel();
        const h = { timer: 0, x: e.clientX, y: e.clientY, fired: false };
        h.timer = window.setTimeout(() => {
          h.fired = true;
          props.onLongPress?.();
        }, LONG_PRESS_MS);
        hold.current = h;
      }}
      onPointerMove={e => {
        const h = hold.current;
        if (h && Math.hypot(e.clientX - h.x, e.clientY - h.y) > 8) cancel();
      }}
      onPointerUp={cancel}
      onPointerCancel={cancel}
      onClick={e => {
        if (hold.current?.fired) {
          hold.current = null;
          return;
        }
        props.onPress(e.currentTarget);
      }}>
      {props.children}
      {props.label && <span className="tile-label">{props.label}</span>}
      {props.controls}
    </button>
  );
}
