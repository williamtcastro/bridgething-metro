import { useEffect, useState } from 'react';

// one live tile animates at a time, at a random 3 to 8 s interval. paused (edit mode) settles every tile back to
// its front face and stops the schedule until it resumes.
export function useLiveTiles(keys: string[], paused = false): string | null {
  const [flipped, setFlipped] = useState<string | null>(null);
  useEffect(() => {
    if (paused) {
      setFlipped(null);
      return;
    }
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
  }, [keys, paused]);
  return flipped;
}
