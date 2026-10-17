import { Icon } from '@/components/Icon';
import type { Size } from '@/lib/layout';
import type { Note } from '@/types';

import { Flip } from './Flip';

export function NotesFace({ notes, flipped, size }: { notes: Note[]; flipped: boolean; size: Size }) {
  // the small face is the WP iconic tile: bell with the count in its corner, flipping to the count alone
  if (size === 'small') {
    const count = notes.length;
    return (
      <Flip flipped={flipped && count > 0}>
        <span className="note-glyph">
          <Icon name="alert" size={44} />
          {count > 0 && <span className="note-small-count">{count}</span>}
        </span>
        <span className="note-glyph note-big-count">{count}</span>
      </Flip>
    );
  }
  const [first, second] = notes;
  const face = (n: Note | undefined) =>
    n ? (
      <>
        <span className="note-app">{n.app}</span>
        <span className="note-body">
          {n.title}
          {'\n'}
          {n.body}
        </span>
      </>
    ) : (
      <span className="note-glyph">
        <Icon name="alert" size={72} />
      </span>
    );
  return (
    <>
      <Flip flipped={flipped && !!second}>
        {face(first)}
        {face(second)}
      </Flip>
      {notes.length > 0 && <span className="tile-count">{notes.length}</span>}
    </>
  );
}
