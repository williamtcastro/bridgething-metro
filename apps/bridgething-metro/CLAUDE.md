# Metro: agent guide

Metro is a launcher (`"role": "launcher"` in `public/manifest.json`): a Windows Phone 8.1 style Start screen. The daemon
keeps a launcher out of `client.webapp.list`, and holding the launcher slot makes it the boot screen and the target of
the return-home gesture. `bun run push` claims the slot; `bun run push --release` hands it back to the built-in hub,
the recovery path when a build wedges the device. Design values (grid, type, colour, motion) live in
`docs/DESIGN.md` at the repo root; read it before changing anything visual.

## Layout

```
src/
  main.tsx               paints the cached theme before react, mounts App under ErrorBoundary
  App.tsx                the panorama: focus, scrolling, sections, edit mode, launch motion, flyouts
  types.ts               Launcher (everything the UI reads and calls), Note, StartLayout, DeviceSettings...
  components/            one component per file; tiles/ holds the tile faces, Tile, TileControls, Flip
  hooks/
    useLauncher.ts       the live client; `?mock` swaps in useMockLauncher with the same Launcher shape
    useDevice.ts         brightness, paired phones, version, restart
    useWeather.ts        forecast, retries, cache
    useInput.ts          knob, keys, presets, holds; useDrag: touch panning and fling
  lib/                   pure helpers: grid packing, tiles and layout, theme, player merge, notifications,
                         weather, app names and glyphs, caches
  styles/weather.css     the weather face; everything else is in index.css
settings/                the companion-app settings page (single file, runs on the phone, not the device)
```

Imports use `@/` for `src/`, siblings use `./`, types use `import type`. `useLauncher` and `useMockLauncher` must
return the same `Launcher`; add a field to both or the mock stops compiling.

## Invariants

- **One focus index across the whole strip.** Focusable elements carry `data-focus`, and their DOM order is the knob
  order. Each section gets `focusedIndex = focus - <stops before it>`, so a section that adds or removes focusable
  elements must update the arithmetic in `App.tsx` (`noteStops`, `musicStops`).
- **Start tiles are packed, not placed.** `lib/tiles.ts` builds the default list, applies the saved layout (hidden,
  order, sizes), and `lib/layout.ts` packs it first fit, column by column, four small rows high. Moving a tile changes
  its place in the order; the grid reflows. `allowedSizes` is the single rule for what a tile can be.
- **The layout is shared.** `layout` and `tiles` are per-webapp docs. The launcher writes `tiles` (the catalog the
  companion lists) and both sides write `layout`; edits from either show up live through `doc.onChanged`.
- **Theme precedence.** Companion config (`theme`, `accent`) is the base; a pick on the device lives in `client.store`
  under `theme_override` and wins until the companion changes that same key, which clears it.
- **Tile faces clip in `.tile-body`.** The tile itself does not clip, so edit controls can overhang it. Anything a face
  parks outside its box (the music meta on a medium tile, the art peek) stays hidden only because of that layer.
- **Edit mode animates nothing.** Live tiles pause and every transition is off while a move or resize re-packs the
  grid; motion mid-reflow tears on the device.
- **Live tiles take turns.** `useLiveTiles` flips one random tile every 3 to 8 s; keep new live behaviour inside it.

## The device lies in ways desktop chrome does not

Every one of these looked fine in `?mock` and broke on the Car Thing:

- `dev:device` serves over plain http, so `crypto.randomUUID` is missing. Request ids (which the daemon requires to be
  real uuids) are built from `crypto.getRandomValues` in `lib/util.ts`.
- The iPhone reports locales like `en_US`, which `Intl` rejects with a RangeError mid-render. `lib/time.ts` falls back.
- Asset and icon bytes arrive as plain number arrays; wrap them in `Uint8Array` before making a Blob.
- iOS now-playing only sends fields that changed, and the daemon clears the rest on a track change, so the next song
  by the same artist arrives with no artist or art. `lib/player.ts` keeps the last known value of every empty field.
- The daemon replays every notification it still holds on connect, and a clear only reaches the phone when it offered
  a negative action. Cleared ids are remembered in page storage (`metro-dismissed`) and skipped on replay.
- The phone link comes up after the page loads, and the phone often shares no location (`geo` answers
  `unavailable`). Weather retries from 30 s and falls back to an IP-located city through `net.fetch`.
- A single knob detent is one wheel event with a large delta: move at most one step per event.
- Holding a hardware button auto-repeats `keydown`; ignore `e.repeat` for anything that toggles.
- The daemon caches manifests. After changing `public/manifest.json` on an installed app, restart the daemon or the
  old permissions, config fields and icon stay in effect.
- Returning from an app reloads the launcher; the app list, layout, theme and weather are cached in page storage so
  the first frame already shows the final grid.

Do not turn on trace logging on the device (`just trace-dropin`); it stalled the Car Thing until a reboot.

## Working loop

```sh
bun run --cwd apps/bridgething-metro typecheck
bun run --cwd apps/bridgething-metro build
bun run check                                  # from the repo root: what CI runs
```

- **Without a device:** `bun run dev` and open `http://localhost:5173/?mock` at 800x480. `accent`, `theme` and `knob`
  preview options. For a screenshot, `vite preview` the build and drive headless Chrome over CDP (keys `1`-`4`, `m`,
  `Escape`, `Enter`, arrows; `mouseWheel` with `deltaX` for the knob).
- **On the device:** `bun run push` from the app folder installs it. Chromium's debugging port is reachable at
  `http://bridgething.local:9222/json`, so `Runtime.evaluate` reads page state and console output, and
  `Page.captureScreenshot` takes a real 800x480 shot. The daemon also accepts a `BridgethingClient` straight from the
  Mac at `ws://bridgething.local:8891/`, which is the way to see what the player or notifications actually send.
  Read-only probes are fine; ask before skipping tracks or clearing notifications on someone's phone.
- **Shipping:** change the app, `bun run bump bridgething-metro <patch|minor|x.y.z> -m "note"`, write the changelog
  section, commit, push to main. Screenshots in `screenshots/` are only uploaded while a new version is built, so a
  screenshot change needs a bump too. A published version's changelog text is frozen.

## Style

Match the surrounding code: 2-space indent, single quotes, semicolons, 120 columns, terse lowercase comments for the
non-obvious why only. No em or en dashes anywhere. No new dependencies without a reason; icons come from
`@fluentui/svg-icons` and `simple-icons` through `components/Icon.tsx`.
