import { useEffect, useState } from 'react';

// white text needs at least this contrast against the tile, so bright art is darkened until it gets there
const MIN_CONTRAST = 4.5;

// the album art's dominant colour, for the now playing tile. the art is shrunk to 16x16 and averaged with
// saturated pixels weighted up, so a grey border or a white backdrop does not wash the colour out.
export function useArtColor(url: string | null): string | null {
  const [color, setColor] = useState<string | null>(null);
  useEffect(() => {
    if (!url) {
      setColor(null);
      return;
    }
    let stale = false;
    const img = new Image();
    img.onload = () => {
      if (!stale) setColor(dominant(img));
    };
    img.src = url;
    return () => {
      stale = true;
    };
  }, [url]);
  return color;
}

function dominant(img: HTMLImageElement): string | null {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 16;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, 16, 16);
    const px = ctx.getImageData(0, 0, 16, 16).data;
    let r = 0;
    let g = 0;
    let b = 0;
    let total = 0;
    for (let i = 0; i < px.length; i += 4) {
      const max = Math.max(px[i], px[i + 1], px[i + 2]);
      const min = Math.min(px[i], px[i + 1], px[i + 2]);
      const weight = 1 + ((max - min) / 255) * 4;
      r += px[i] * weight;
      g += px[i + 1] * weight;
      b += px[i + 2] * weight;
      total += weight;
    }
    return darken([r / total, g / total, b / total]);
  } catch {
    // a tainted canvas or a decode failure: the tile keeps the accent
    return null;
  }
}

function darken([r, g, b]: number[]): string {
  let k = 1;
  while (k > 0.2 && contrast([r * k, g * k, b * k]) < MIN_CONTRAST) k -= 0.05;
  return `rgb(${Math.round(r * k)}, ${Math.round(g * k)}, ${Math.round(b * k)})`;
}

// WCAG contrast of white text over this colour
function contrast(rgb: number[]) {
  const [r, g, b] = rgb.map(c => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return 1.05 / (l + 0.05);
}
