import alert from '@fluentui/svg-icons/icons/alert_24_regular.svg?raw';
import bluetooth from '@fluentui/svg-icons/icons/bluetooth_24_regular.svg?raw';
import calendar from '@fluentui/svg-icons/icons/calendar_ltr_24_regular.svg?raw';
import desktop from '@fluentui/svg-icons/icons/desktop_24_regular.svg?raw';
import globe from '@fluentui/svg-icons/icons/globe_24_regular.svg?raw';
import home from '@fluentui/svg-icons/icons/home_24_regular.svg?raw';
import info from '@fluentui/svg-icons/icons/info_24_regular.svg?raw';
import map from '@fluentui/svg-icons/icons/map_24_regular.svg?raw';
import mic from '@fluentui/svg-icons/icons/mic_24_regular.svg?raw';
import music from '@fluentui/svg-icons/icons/music_note_2_24_regular.svg?raw';
import next from '@fluentui/svg-icons/icons/next_24_filled.svg?raw';
import pause from '@fluentui/svg-icons/icons/pause_24_filled.svg?raw';
import play from '@fluentui/svg-icons/icons/play_24_filled.svg?raw';
import previous from '@fluentui/svg-icons/icons/previous_24_filled.svg?raw';
import settings from '@fluentui/svg-icons/icons/settings_24_regular.svg?raw';
import weather from '@fluentui/svg-icons/icons/weather_partly_cloudy_day_24_regular.svg?raw';
import spotify from 'simple-icons/icons/spotify.svg?raw';

const ICONS = {
  alert,
  bluetooth,
  calendar,
  desktop,
  globe,
  home,
  info,
  map,
  mic,
  music,
  next,
  pause,
  play,
  previous,
  settings,
  spotify,
  weather,
};

export type IconName = keyof typeof ICONS;

// fluent and simple-icons svgs both draw in currentColor once their size, fill and <title> tooltip are dropped
export function Icon({ name, size = 24 }: { name: IconName; size?: number }) {
  const svg = ICONS[name]
    .replace(/<title>[^<]*<\/title>/, '')
    .replace(/ (width|height|fill|role)="[^"]*"/g, '')
    .replace('<svg', `<svg width="${size}" height="${size}" fill="currentColor"`);
  return <span className="icon" aria-hidden="true" dangerouslySetInnerHTML={{ __html: svg }} />;
}
