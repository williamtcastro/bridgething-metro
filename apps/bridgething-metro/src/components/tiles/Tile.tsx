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
  music?: boolean;
  onPress(el: HTMLElement): void;
  children: ReactNode;
}) {
  const left = props.col * STEP;
  const style = {
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
      className={`tile${props.focused ? ' focused' : ''}${props.music ? ' tile-music' : ''}`}
      style={style}
      onClick={e => props.onPress(e.currentTarget)}>
      {props.children}
      {props.label && <span className="tile-label">{props.label}</span>}
    </button>
  );
}
