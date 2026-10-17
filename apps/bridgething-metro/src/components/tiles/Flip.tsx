import type { ReactNode } from 'react';

export function Flip({ flipped, children }: { flipped: boolean; children: [ReactNode, ReactNode] }) {
  return (
    <span className={`flip${flipped ? ' flipped' : ''}`}>
      <span className="face">{children[0]}</span>
      <span className="face back">{children[1]}</span>
    </span>
  );
}
