import { Icon } from '@/components/Icon';
import type { Note } from '@/types';

import { Flip } from './Flip';

export function NotesFace({ notes, flipped }: { notes: Note[]; flipped: boolean }) {
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
