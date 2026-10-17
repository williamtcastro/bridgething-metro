import type { BridgethingClient, NetFetchReply } from '@bridgething/client';
import type { IconName } from '@/components/Icon';

export type Weather = {
  temp: number;
  high: number;
  low: number;
  code: number;
  day: boolean;
  units: 'metric' | 'imperial';
  at: number;
};

export type Coords = { lat: number; lon: number };

export function parseCoords(s: string | null | undefined): Coords | null {
  if (!s) return null;
  const m = s.split(',').map(p => Number(p.trim()));
  if (m.length !== 2 || m.some(n => !Number.isFinite(n))) return null;
  if (Math.abs(m[0]) > 90 || Math.abs(m[1]) > 180) return null;
  return { lat: m[0], lon: m[1] };
}

export async function fetchWeather(
  client: BridgethingClient,
  coords: Coords,
  units: 'metric' | 'imperial',
): Promise<Weather> {
  const params = new URLSearchParams({
    latitude: String(coords.lat),
    longitude: String(coords.lon),
    current: 'temperature_2m,weather_code,is_day',
    daily: 'temperature_2m_max,temperature_2m_min',
    timezone: 'auto',
    temperature_unit: units === 'imperial' ? 'fahrenheit' : 'celsius',
    forecast_days: '1',
  });
  const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
  const res = await client.net.fetch({
    request: { url, method: 'GET', headers: [], body: null, timeoutMs: 12_000, redirect: 'follow' },
  });
  if (!res.ok) throw new Error(res.kind === 'domain' ? 'no network' : 'network request failed');
  const reply = res.response as NetFetchReply;
  if (reply.response.status >= 400) throw new Error(`weather api returned ${reply.response.status}`);
  // the bytes arrive as a plain number array
  const json = JSON.parse(new TextDecoder().decode(new Uint8Array(reply.response.body as unknown as number[])));
  return {
    temp: Math.round(json.current.temperature_2m),
    high: Math.round(json.daily.temperature_2m_max[0]),
    low: Math.round(json.daily.temperature_2m_min[0]),
    code: json.current.weather_code,
    day: json.current.is_day === 1,
    units,
    at: Date.now(),
  };
}

export function weatherGlyph(code: number, day: boolean): IconName {
  if (code === 0) return day ? 'sunny' : 'moon';
  if (code <= 2) return 'weather';
  if (code === 3) return 'cloudy';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 51 && code <= 57) return 'drizzle';
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
  if (code >= 95) return 'storm';
  return 'cloudy';
}

export function weatherText(code: number): string {
  if (code === 0) return 'clear';
  if (code <= 2) return 'partly cloudy';
  if (code === 3) return 'cloudy';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 51 && code <= 57) return 'drizzle';
  if (code >= 61 && code <= 67) return 'rain';
  if (code >= 80 && code <= 82) return 'showers';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
  if (code >= 95) return 'storm';
  return 'cloudy';
}
