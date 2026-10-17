import { Icon } from '@/components/Icon';
import { sourceGlyph } from '@/lib/app-glyphs';
import { byline } from '@/lib/util';
import type { Launcher } from '@/types';

export function MusicSection(props: { launcher: Launcher; focusedIndex: number }) {
  const { launcher } = props;
  const np = launcher.nowPlaying;
  // when the knob is volume only play/pause takes focus, so a press plays or pauses and prev/next are touch.
  // when it scrolls, all three are knob stops.
  const all = launcher.musicKnob === 'scroll';
  const controls = [
    { key: 'prev', icon: 'previous', label: 'previous', run: launcher.prev, knob: all },
    {
      key: 'play',
      icon: np?.playing ? 'pause' : 'play',
      label: np?.playing ? 'pause' : 'play',
      run: launcher.togglePlay,
      knob: true,
    },
    { key: 'next', icon: 'next', label: 'next', run: launcher.next, knob: all },
  ] as const;
  const stops = controls.filter(c => c.knob).map(c => c.key);
  return (
    <section data-section="music" className="music">
      <span className="music-big-art">
        {np?.artUrl ? <img src={np.artUrl} alt="" draggable={false} /> : <Icon name={sourceGlyph(np?.source ?? null)} size={120} />}
      </span>
      <span className="music-big-meta">
        <span className="music-big-title">{np?.title ?? 'nothing playing'}</span>
        <span className="music-big-artist">{np ? byline(np) : ''}</span>
        {np?.album && <span className="music-big-album">{np.album}</span>}
        {np?.artist && np.source && <span className="music-big-album">via {np.source.toLowerCase()}</span>}
        <span className="music-controls">
          {controls.map(c => (
            <button
              key={c.key}
              type="button"
              data-focus={c.knob ? '' : undefined}
              aria-label={c.label}
              className={`round${c.knob && stops.indexOf(c.key) === props.focusedIndex ? ' focused' : ''}`}
              onClick={c.run}>
              <Icon name={c.icon} size={28} />
            </button>
          ))}
        </span>
      </span>
    </section>
  );
}
