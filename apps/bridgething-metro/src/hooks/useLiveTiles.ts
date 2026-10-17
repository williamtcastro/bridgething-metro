import { useEffect, useState } from 'react';

// one live tile animates at a time, at a random 3 to 8 s interval
export function useLiveTiles(keys: string[]): string | null {
  const [flipped, setFlipped] = useState<string | null>(null);
  useEffect(() => {
    let t = 0;
    const tick = () => {
      t = window.setTimeout(
        () => {
          const key = keys[Math.floor(Math.random() * keys.length)];
          setFlipped(f => (f === key ? null : key));
          tick();
        },
        3000 + Math.random() * 5000,
      );
    };
    tick();
    return () => window.clearTimeout(t);
  }, [keys]);
  return flipped;
}
