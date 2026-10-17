export type Size = 'small' | 'medium' | 'wide';

export const ROWS = 4;
export const UNIT = 94;
export const GAP = 12;
export const STEP = UNIT + GAP;

const SPAN: Record<Size, { w: number; h: number }> = {
  small: { w: 1, h: 1 },
  medium: { w: 2, h: 2 },
  wide: { w: 4, h: 2 },
};

export type Placed<T> = T & { col: number; row: number; w: number; h: number };

// first fit, scanning down each column then right, so the grid grows sideways like a panorama
export function pack<T extends { size: Size }>(tiles: T[]): Placed<T>[] {
  const taken = new Set<string>();
  const free = (c: number, r: number, w: number, h: number) => {
    if (r + h > ROWS) return false;
    for (let x = c; x < c + w; x++) for (let y = r; y < r + h; y++) if (taken.has(`${x},${y}`)) return false;
    return true;
  };

  return tiles.map(tile => {
    const { w, h } = SPAN[tile.size];
    for (let col = 0; ; col++) {
      for (let row = 0; row < ROWS; row++) {
        if (!free(col, row, w, h)) continue;
        for (let x = col; x < col + w; x++) for (let y = row; y < row + h; y++) taken.add(`${x},${y}`);
        return { ...tile, col, row, w, h };
      }
    }
  });
}

export function px(units: number) {
  return units * STEP - GAP;
}
