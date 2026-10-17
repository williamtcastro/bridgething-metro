import type { MediaItem, NowPlayingUpdate, PlayerState } from '@bridgething/client';

export const BLANK_ITEM: MediaItem = {
  uri: null,
  persistentId: null,
  title: null,
  album: null,
  albumUri: null,
  albumArtist: null,
  artist: null,
  artistUri: null,
  liked: null,
  artworkId: null,
  durationMs: null,
  mediaTypes: null,
  trackNumber: null,
  trackCount: null,
  isLikeSupported: null,
  isBanSupported: null,
  isBanned: null,
  chapterCount: null,
};

// the iphone only sends now-playing fields that changed: the next song by the same band, or from the same album,
// arrives without artist or artwork, and the daemon clears them on a track change. so an empty field keeps the
// last known value and only a real value replaces it.
export function fill(prev: MediaItem | null, next: Partial<MediaItem>): MediaItem {
  const known = Object.fromEntries(
    Object.entries(next).filter(([k, v]) => v !== null && v !== undefined && k in BLANK_ITEM),
  );
  return { ...BLANK_ITEM, ...prev, ...known };
}

export function keepKnown(prev: PlayerState | null, next: PlayerState): PlayerState {
  // no track means playback stopped; that one is real, not an omission
  if (!next.track) return next;
  return { ...next, track: fill(prev?.track ?? null, next.track) };
}

export function applyDelta(p: PlayerState, d: NowPlayingUpdate): PlayerState {
  const track = d.mediaItem ? fill(p.track, d.mediaItem) : p.track;
  const playing = d.playback?.playing;
  const playback =
    playing === null || playing === undefined ? p.playback : { ...p.playback, state: playing ? 'playing' : 'paused' } as const;
  return { ...p, track, playback };
}
