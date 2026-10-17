import type { ReactNode } from 'react';

import { Icon } from '@/components/Icon';
import { appGlyph } from '@/lib/app-glyphs';
import { initial } from '@/lib/util';
import type { AppEntry } from '@/types';

export function AppList(props: { apps: AppEntry[]; focusedIndex: number; onPress(el: HTMLElement, id: string): void }) {
  const sorted = [...props.apps].sort((a, b) => a.name.localeCompare(b.name));
  const rows: ReactNode[] = [];
  let letter = '';
  sorted.forEach((app, i) => {
    const l = initial(app.name);
    if (l !== letter) {
      letter = l;
      rows.push(
        <span key={`l-${l}`} className="jump">
          {l.toLowerCase()}
        </span>,
      );
    }
    rows.push(
      <button
        key={app.id}
        type="button"
        data-focus
        className={`app-row${props.focusedIndex === i ? ' focused' : ''}`}
        onClick={e => props.onPress(e.currentTarget, app.id)}>
        <span className="app-row-icon">
          {appGlyph(app.name) ? (
            <Icon name={appGlyph(app.name)!} size={32} />
          ) : app.iconUrl ? (
            <img src={app.iconUrl} alt="" draggable={false} />
          ) : (
            initial(app.name)
          )}
        </span>
        <span className="app-row-name">{app.name.toLowerCase()}</span>
      </button>,
    );
  });
  return (
    <section data-section="apps" className="apps">
      {rows}
    </section>
  );
}
