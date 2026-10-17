import { noteTime } from '@/lib/notifications';
import type { Note } from '@/types';

type Action = 'positive' | 'negative';

// the WP action center as a panorama page: "clear all" on the left, then one card per notification with the
// phone's own actions. the knob walks every button in order; focusedIndex counts from "clear all".
export function NotificationList(props: {
  notes: Note[];
  now: Date;
  focusedIndex: number;
  onAct(el: HTMLElement, id: string, action: Action): void;
  onClear(el: HTMLElement): void;
}) {
  if (props.notes.length === 0) {
    return (
      <section data-section="notifications" className="notes">
        <span className="notes-empty">no notifications</span>
      </section>
    );
  }

  let stop = 0;
  const focused = () => (stop++ === props.focusedIndex ? ' focused' : '');
  const action = (note: Note, kind: Action, label: string | null) =>
    label && (
      <button
        type="button"
        data-focus
        className={`metro-button${focused()}`}
        onClick={e => props.onAct(e.currentTarget, note.id, kind)}>
        {label.toLowerCase()}
      </button>
    );

  return (
    <section data-section="notifications" className="notes">
      <button type="button" data-focus className={`metro-button notes-clear${focused()}`} onClick={e => props.onClear(e.currentTarget)}>
        clear all
      </button>
      <div className="notes-grid">
        {props.notes.map(note => (
          <article key={note.id} className="note-card">
            <span className="note-card-head">
              <span className="note-card-app">{note.app.toLowerCase()}</span>
              <span className="note-card-time">{noteTime(note.time, props.now)}</span>
            </span>
            <span className="note-card-title">{note.title}</span>
            <span className="note-card-body">{note.body}</span>
            <span className="note-card-actions">
              {action(note, 'positive', note.positive)}
              {action(note, 'negative', note.negative)}
            </span>
          </article>
        ))}
      </div>
    </section>
  );
}
