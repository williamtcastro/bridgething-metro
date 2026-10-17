import type { Size } from '@/lib/layout';

const SIZES: Size[] = ['small', 'medium', 'wide'];

// the WP app bar for edit mode: a size per button, so a size is one tap away instead of a cycle on a tile corner.
// sizes the selected tile cannot take stay visible but disabled, so the bar never shifts between tiles.
export function EditBar(props: { size: Size; allowed: Size[]; onPick(size: Size): void; onDone(): void }) {
  return (
    <div className="edit-bar" role="toolbar" aria-label="tile size">
      <span className="edit-bar-label">size</span>
      {SIZES.map(s => (
        <button
          key={s}
          type="button"
          disabled={!props.allowed.includes(s)}
          className={`metro-button${props.size === s ? ' on' : ''}`}
          onClick={() => props.onPick(s)}>
          {s}
        </button>
      ))}
      <button type="button" className="metro-button edit-bar-done" onClick={props.onDone}>
        done
      </button>
    </div>
  );
}
