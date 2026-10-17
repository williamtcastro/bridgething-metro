import type { MouseEvent, ReactNode } from 'react';

import { Icon, type IconName } from '@/components/Icon';

// the move buttons drawn on the selected tile; size and done live on the edit bar at the bottom. they sit inside
// the tile's own <button>, so they are spans with a button role, and each stops its click so the tile underneath
// does not also react.
export function TileControls(props: { onMove(d: number): void }) {
  return (
    <span className="tile-controls">
      <Control className="tc-prev" label="move earlier" icon="arrowLeft" run={() => props.onMove(-1)} />
      <Control className="tc-next" label="move later" icon="arrowRight" run={() => props.onMove(1)} />
    </span>
  );
}

function Control(props: { className: string; label: string; icon: IconName; run(): void }): ReactNode {
  const fire = (e: MouseEvent) => {
    e.stopPropagation();
    props.run();
  };
  return (
    <span role="button" aria-label={props.label} className={`tile-control ${props.className}`} onClick={fire}>
      <Icon name={props.icon} size={20} />
    </span>
  );
}
