import { Icon } from '@/components/Icon';
import { sourceGlyph } from '@/lib/app-glyphs';
import type { Size } from '@/lib/layout';
import { byline } from '@/lib/util';
import type { Launcher } from '@/types';

// `peek` is the WP music tile's live motion: the album art slides up over the whole tile, then back down to show
// the track again. it only runs when there is art to show.
export function MusicFace({ launcher, peek, size }: { launcher: Launcher; peek: boolean; size: Size }) {
  const np = launcher.nowPlaying;
  // medium is the art alone with the title along its foot; the side panel of the wide face has no room there
  if (size !== 'wide') {
    return (
      <span className={`music-art music-art-full${np?.artUrl ? '' : ' music-art-empty'}`}>
        {np?.artUrl ? <img src={np.artUrl} alt="" draggable={false} /> : <Icon name={sourceGlyph(np?.source ?? null)} size={72} />}
        <span className="music-peek-label">{np?.title ?? 'nothing playing'}</span>
      </span>
    );
  }
  return (
    <>
      <span className={`music-art${np?.artUrl ? '' : ' music-art-empty'}`}>
        {np?.artUrl ? <img src={np.artUrl} alt="" draggable={false} /> : <Icon name={sourceGlyph(np?.source ?? null)} size={88} />}
      </span>
      <span className="music-meta">
        <span className="music-title">{np?.title ?? 'nothing playing'}</span>
        {np && <span className="music-artist">{byline(np)}</span>}
      </span>
      <span className="tile-label music-label">now playing</span>
      {np?.artUrl && (
        <span className={`music-peek${peek ? ' on' : ''}`} aria-hidden="true">
          <img src={np.artUrl} alt="" draggable={false} />
          <span className="music-peek-label">{np.title}</span>
        </span>
      )}
    </>
  );
}
