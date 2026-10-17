import type { CSSProperties, ReactNode } from 'react';

import { HINGE, MARGIN } from '@/lib/constants';
import { px, STEP } from '@/lib/layout';

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
  onPress(el: HTMLElement): void;
  children: ReactNode;
}) {
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
      className={`tile${props.focused ? ' focused' : ''}`}
      style={style}
      onClick={e => props.onPress(e.currentTarget)}>
      {props.children}
      {props.label && <span className="tile-label">{props.label}</span>}
    </button>
  );
}
