import type { Volume } from '@/types';

export function VolumeBar({ volume }: { volume: Volume | null }) {
  const fill = volume && !volume.muted ? volume.level : 0;
  return (
    <span className="volume" aria-label="volume">
      <span className="volume-label">{volume?.muted ? 'muted' : 'volume'}</span>
      <span className="volume-track">
        <span className="volume-fill" style={{ width: `${Math.round(fill * 100)}%` }} />
      </span>
      <span className="volume-value">{volume ? Math.round(volume.level * 100) : '--'}</span>
    </span>
  );
}
