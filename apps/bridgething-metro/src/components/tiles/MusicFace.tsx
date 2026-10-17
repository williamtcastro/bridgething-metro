import { Icon } from '@/components/Icon';
import { sourceGlyph } from '@/lib/app-glyphs';
import { byline } from '@/lib/util';
import type { Launcher } from '@/types';

// `peek` is the WP music tile's live motion: the album art slides up over the whole tile, then back down to show
// the track again. it only runs when there is art to show.
export function MusicFace({ launcher, peek }: { launcher: Launcher; peek: boolean }) {
  const np = launcher.nowPlaying;
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
