import type { BridgethingClient } from '@bridgething/client';
import { useEffect, useState } from 'react';
import { fetchWeather, ipCoords, parseCoords, type Weather } from '@/lib/weather';

const KEY = 'metro-weather';
const REFRESH_MS = 15 * 60 * 1000;
const RETRY_MS = 30 * 1000;

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
    let timer = 0;
    // a fetch at load usually races the phone link (location and net.fetch both go through the phone), so a
    // failure retries at 30 s, doubling up to the 15 min refresh, instead of leaving the tile empty for 15 min
    let retry = RETRY_MS;
    const schedule = (ms: number) => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => void load(), ms);
    };

    const load = async () => {
      if (busy) return;
      busy = true;
      try {
        let coords = parseCoords(location);
        if (!coords) {
          const r = await client.geo.getOnce({ accuracy: 'coarse' });
          coords = r.ok ? { lat: r.response.position.lat, lon: r.response.position.lon } : await ipCoords(client);
        }
        const w = await fetchWeather(client, coords, units);
        if (!alive) return;
        setWeather(w);
        writeCache(w);
        retry = RETRY_MS;
        schedule(REFRESH_MS);
      } catch (err) {
        // keep the last good reading
        console.warn('[metro] weather', err instanceof Error ? err.message : err);
        if (!alive) return;
        schedule(retry);
        retry = Math.min(retry * 2, REFRESH_MS);
      } finally {
        busy = false;
      }
    };

    void load();
    const offs = [
      client.on(e => {
        if (e.type === 'open') void load();
      }),
      // the phone connecting is what makes location and fetch possible, so try again the moment it does
      client.peer.onSnapshot(() => void load()),
    ];
    return () => {
      alive = false;
      window.clearTimeout(timer);
      for (const off of offs) off();
    };
  }, [client, units, location]);

  return weather;
}
