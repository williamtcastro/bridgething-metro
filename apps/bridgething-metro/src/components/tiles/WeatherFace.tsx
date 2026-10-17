import { Icon } from '@/components/Icon';
import type { Size } from '@/lib/layout';
import { type Weather, weatherGlyph, weatherText } from '@/lib/weather';

export function WeatherFace({ weather, size }: { weather: Weather; size: Size }) {
  const glyph = <Icon name={weatherGlyph(weather.code, weather.day)} size={size === 'small' ? 40 : 64} />;
  if (size === 'small') {
    return (
      <div className="weather-face weather-small">
        <div className="weather-glyph">{glyph}</div>
        <div className="weather-temp">{weather.temp}°</div>
      </div>
    );
  }
  return (
    <div className={`weather-face weather-${size}`}>
      <div className="weather-main">
        <div className="weather-glyph">{glyph}</div>
        <div className="weather-temp">{weather.temp}°</div>
        <div className="weather-range">
          {weather.high}° / {weather.low}°
        </div>
      </div>
      {size === 'wide' && <div className="weather-text">{weatherText(weather.code)}</div>}
    </div>
  );
}
