import { Icon } from '@/components/Icon';
import { appGlyph } from '@/lib/app-glyphs';
import type { Size } from '@/lib/layout';
import { initial } from '@/lib/util';
import type { AppEntry } from '@/types';

export function AppFace({ app, size }: { app: AppEntry; size: Size }) {
  const glyph = size === 'small' ? 44 : 72;
  const metro = appGlyph(app.name);
  return (
    <span className="app-glyph">
      {metro ? (
        <Icon name={metro} size={glyph} />
      ) : app.iconUrl ? (
        <img src={app.iconUrl} alt="" width={glyph} height={glyph} draggable={false} />
      ) : (
        <span className="app-letter" style={{ fontSize: glyph * 0.8 }}>
          {initial(app.name)}
        </span>
      )}
    </span>
  );
}
