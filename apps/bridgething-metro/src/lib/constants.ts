export const SECTIONS = ['start', 'notifications', 'apps', 'music', 'settings'] as const;
export type Section = (typeof SECTIONS)[number];
// preset buttons 1-3; preset 4 is play/pause
export const PRESETS: Record<number, Section> = { 1: 'start', 2: 'apps', 3: 'music' };

export const MARGIN = 24;
export const SCREEN = 800;
export const WHEEL_STEP = 40;
// turnstile hinge sits 40px left of the screen, as in WinJS
export const HINGE = -40;
export const LIVE_TILES = ['clock', 'notes', 'music'];
