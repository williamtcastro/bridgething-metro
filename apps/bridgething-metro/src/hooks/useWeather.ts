import type { BridgethingClient } from '@bridgething/client';
import { useEffect, useState } from 'react';
import { fetchWeather, parseCoords, type Weather } from '@/lib/weather';

const KEY = 'metro-weather';
const REFRESH_MS = 15 * 60 * 1000;

function readCache(units: Weather['units']): Weather | null {
  try {
    const w = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Weather | null;
    return w && typeof w.temp === 'number' && w.units === units ? w : null;
  } catch {
    return null;
  }
}

function writeCache(w: Weather) {
  try {
    localStorage.setItem(KEY, JSON.stringify(w));
  } catch {
    // storage unavailable
  }
}

export function useWeather(
  client: BridgethingClient | null,
  units: 'metric' | 'imperial',
  location: string | undefined,
): Weather | null {
  const [weather, setWeather] = useState<Weather | null>(() => readCache(units));

  useEffect(() => {
    // a cached reading in other units is stale for this config
    setWeather(prev => (prev && prev.units === units ? prev : readCache(units)));
    if (!client) return;
    let alive = true;
    let busy = false;

    const load = async () => {
      if (busy) return;
      busy = true;
      try {
        let coords = parseCoords(location);
        if (!coords) {
          const r = await client.geo.getOnce({ accuracy: 'coarse' });
          if (r.ok) coords = { lat: r.response.position.lat, lon: r.response.position.lon };
        }
        if (!coords) return;
        const w = await fetchWeather(client, coords, units);
        if (!alive) return;
        setWeather(w);
        writeCache(w);
      } catch {
        // keep the last good reading
      } finally {
        busy = false;
      }
    };

    void load();
    const timer = window.setInterval(() => void load(), REFRESH_MS);
    const off = client.on(e => {
      if (e.type === 'open') void load();
    });
    return () => {
      alive = false;
      window.clearInterval(timer);
      off();
    };
  }, [client, units, location]);

  return weather;
}
