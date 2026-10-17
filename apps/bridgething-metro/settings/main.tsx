import { settings } from '@bridgething/client/settings';
import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ACCENTS, DEFAULT_THEME } from '../src/lib/theme';
import { TilesSection } from './tiles';
import './style.css';

type Values = { theme: string; accent: string; music_knob: string };

const DEFAULTS: Values = { theme: DEFAULT_THEME.theme, accent: DEFAULT_THEME.accent, music_knob: 'volume' };

const KNOBS = [
  { value: 'volume', label: 'volume', hint: 'turns volume, press plays/pauses' },
  { value: 'scroll', label: 'scroll', hint: 'keeps navigating; previous, play and next are knob stops' },
];

function Settings() {
  const [values, setValues] = useState<Values>(DEFAULTS);
  const [status, setStatus] = useState('');

  // reflect stored values; fall back to defaults when there is no host
  useEffect(() => {
    (async () => {
      try {
        const entries = await settings.config.list();
        const stored = Object.fromEntries(entries.map(e => [e.key, e.value]));
        setValues(v => ({
          theme: stored.theme === 'light' || stored.theme === 'dark' ? stored.theme : v.theme,
          accent: stored.accent && stored.accent in ACCENTS ? stored.accent : v.accent,
          music_knob: stored.music_knob === 'scroll' || stored.music_knob === 'volume' ? stored.music_knob : v.music_knob,
        }));
      } catch {
        // no host: keep defaults
      }
    })();
  }, []);

  // the page follows the chosen theme and accent
  useEffect(() => {
    document.documentElement.dataset.theme = values.theme;
    document.documentElement.style.setProperty('--accent', ACCENTS[values.accent] ?? ACCENTS[DEFAULTS.accent]);
  }, [values.theme, values.accent]);

  // write on change
  async function change(key: keyof Values, value: string) {
    setValues(v => ({ ...v, [key]: value }));
    try {
      await settings.config.set(key, value);
      setStatus('');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <main>
      <h1>metro</h1>
      <p className="sub">settings</p>

      <h2>background</h2>
      <div className="themes" role="radiogroup" aria-label="Background">
        {(['dark', 'light'] as const).map(t => (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={values.theme === t}
            className={`theme ${t}`}
            onClick={() => change('theme', t)}
          >
            <span className="preview">
              <i />
              <i />
            </span>
            <span className="name">{t}</span>
          </button>
        ))}
      </div>

      <h2>accent colour</h2>
      <div className="swatches" role="radiogroup" aria-label="Accent colour">
        {Object.entries(ACCENTS).map(([name, hex]) => (
          <button
            key={name}
            type="button"
            role="radio"
            aria-checked={values.accent === name}
            className="swatch"
            style={{ background: hex }}
            onClick={() => change('accent', name)}
          >
            <span>{name}</span>
          </button>
        ))}
      </div>

      <h2>knob on the music screen</h2>
      <div className="knobs" role="radiogroup" aria-label="Knob on the music screen">
        {KNOBS.map(k => (
          <button
            key={k.value}
            type="button"
            role="radio"
            aria-checked={values.music_knob === k.value}
            className="knob"
            onClick={() => change('music_knob', k.value)}
          >
            <span className="radio" />
            <span className="text">
              <b>{k.label}</b>
              <small>{k.hint}</small>
            </span>
          </button>
        ))}
      </div>

      <TilesSection />

      <p className="status">{status}</p>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<Settings />);
