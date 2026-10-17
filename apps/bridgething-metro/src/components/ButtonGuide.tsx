// what each hardware button does, shown as a chrome band like the volume flyout while a preset is held
const BUTTONS = [
  { key: '1', label: 'start' },
  { key: '2', label: 'apps' },
  { key: '3', label: 'music' },
  { key: '4', label: 'play / pause' },
  { key: 'menu', label: 'start / music' },
];

export function ButtonGuide({ held }: { held: number }) {
  return (
    <div className="flyout guide" role="status">
      {BUTTONS.map(b => (
        <span key={b.key} className={`guide-item${b.key === String(held) ? ' on' : ''}`}>
          <span className="guide-key">{b.key}</span>
          <span className="guide-label">{b.label}</span>
        </span>
      ))}
    </div>
  );
}
