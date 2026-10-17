import type { BridgethingClient, Device } from '@bridgething/client';
import { useEffect, useState } from 'react';

import { clamp } from '@/lib/util';
import type { Brightness, DeviceSettings } from '@/types';

// brightness, paired phones and version for the settings page; the same calls the bridgething hub makes
export function useDevice(client: BridgethingClient | null): DeviceSettings {
  const [brightness, setBrightness] = useState<Brightness | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [connected, setConnected] = useState<string | null>(null);
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    if (!client) return;
    const refresh = () => {
      void client.hardware.stateGet().then(r => {
        if (r.ok) setBrightness({ mode: r.response.state.brightness.mode, level: r.response.state.brightness.level });
      });
      void client.bluetooth.list().then(r => r.ok && setDevices(Object.values(r.response)));
      void client.system.versionRequest().then(r => r.ok && setVersion(r.response.bridgethingVersion));
    };
    refresh();
    const offs = [
      client.on(e => e.type === 'open' && refresh()),
      client.hardware.onBrightnessChanged(b => setBrightness({ mode: b.mode, level: b.level })),
      client.bluetooth.onPairedDevices(map => setDevices(Object.values(map))),
      client.bluetooth.onConnectedDevice(d => setConnected(d.mac)),
      client.bluetooth.onStatus(s => {
        if (!s.connected) setConnected(null);
      }),
    ];
    return () => {
      for (const off of offs) off();
    };
  }, [client]);

  return {
    brightness,
    phones: devices.map(d => ({ mac: d.id, name: d.name, connected: d.id === connected })),
    version,
    setBrightnessMode(mode) {
      setBrightness(b => (b ? { ...b, mode } : b));
      void client?.hardware.displaySetMode({ mode });
    },
    // a manual step switches auto off first, as the hub's slider does
    stepBrightness(direction) {
      if (!client || !brightness) return;
      const level = clamp(Math.round((brightness.level + Math.sign(direction) * 0.1) * 10) / 10, 0.1, 1);
      if (brightness.mode === 'auto') void client.hardware.displaySetMode({ mode: 'manual' });
      setBrightness({ mode: 'manual', level });
      void client.hardware.displaySetLevel({ level });
    },
    connect(mac) {
      void client?.bluetooth.connect({ mac });
    },
    reboot() {
      void client?.system.reboot();
    },
  };
}
