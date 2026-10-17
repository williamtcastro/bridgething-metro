import { useEffect, useState } from 'react';

import { ACCENTS, type Theme } from '@/lib/theme';
import type { DeviceSettings } from '@/types';

// the WP settings list laid sideways: one column per group. restart needs a second press within 3 s.
export function SettingsSection(props: {
  device: DeviceSettings;
  theme: Theme;
  onPickTheme(patch: Partial<Theme>): void;
  focusedIndex: number;
  onFocus(el: HTMLElement): void;
  // edit mode for knob users, who have no long press
  onEditStart(): void;
}) {
  const { device } = props;
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = window.setTimeout(() => setArmed(false), 3000);
    return () => window.clearTimeout(t);
  }, [armed]);

  let stop = 0;
  const focused = () => (stop++ === props.focusedIndex ? ' focused' : '');
  const press = (run: () => void) => (e: React.MouseEvent<HTMLElement>) => {
    props.onFocus(e.currentTarget);
    run();
  };

  const b = device.brightness;
  const auto = b?.mode === 'auto';

  return (
    <section data-section="settings" className="settings">
      <div className="settings-col settings-theme">
        <span className="settings-head">theme</span>
        <span className="settings-buttons">
          {(['dark', 'light'] as const).map(t => (
            <button
              key={t}
              type="button"
              data-focus
              className={`metro-button${props.theme.theme === t ? ' on' : ''}${focused()}`}
              onClick={press(() => props.onPickTheme({ theme: t }))}>
              {t}
            </button>
          ))}
        </span>
        <span className="setting-sub swatch-name">{props.theme.accent}</span>
        <span className="swatches">
          {Object.entries(ACCENTS).map(([name, hex]) => (
            <button
              key={name}
              type="button"
              data-focus
              aria-label={name}
              className={`swatch${props.theme.accent === name ? ' on' : ''}${focused()}`}
              style={{ background: hex }}
              onClick={press(() => props.onPickTheme({ accent: name }))}
            />
          ))}
        </span>
      </div>

      <div className="settings-col">
        <span className="settings-head">display</span>
        <span className="setting-title">brightness</span>
        <span className="setting-sub">{b ? (auto ? 'automatic' : `${Math.round(b.level * 100)}%`) : '--'}</span>
        <span className="settings-buttons">
          <button
            type="button"
            data-focus
            className={`metro-button${auto ? ' on' : ''}${focused()}`}
            onClick={press(() => device.setBrightnessMode(auto ? 'manual' : 'auto'))}>
            auto
          </button>
          <button
            type="button"
            data-focus
            aria-label="dimmer"
            className={`metro-button${focused()}`}
            onClick={press(() => device.stepBrightness(-1))}>
            -
          </button>
          <button
            type="button"
            data-focus
            aria-label="brighter"
            className={`metro-button${focused()}`}
            onClick={press(() => device.stepBrightness(1))}>
            +
          </button>
        </span>
      </div>

      <div className="settings-col">
        <span className="settings-head">bluetooth</span>
        {device.phones.length === 0 && <span className="setting-sub">no paired phones</span>}
        {device.phones.map(phone => (
          <button
            key={phone.mac}
            type="button"
            data-focus
            className={`setting-row${focused()}`}
            onClick={press(() => !phone.connected && device.connect(phone.mac))}>
            <span className="setting-title">{phone.name.toLowerCase()}</span>
            <span className="setting-sub">{phone.connected ? 'connected' : 'tap to connect'}</span>
          </button>
        ))}
      </div>

      <div className="settings-col">
        <span className="settings-head">system</span>
        <span className="setting-title">bridgething</span>
        <span className="setting-sub">{device.version ?? '--'}</span>
        <span className="settings-buttons settings-stack">
          <button
            type="button"
            data-focus
            className={`metro-button${armed ? ' on' : ''}${focused()}`}
            onClick={press(() => (armed ? device.reboot() : setArmed(true)))}>
            {armed ? 'confirm restart' : 'restart'}
          </button>
          <button type="button" data-focus className={`metro-button${focused()}`} onClick={press(props.onEditStart)}>
            edit start
          </button>
        </span>
      </div>
    </section>
  );
}
