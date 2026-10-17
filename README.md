# Metro

A Windows Phone style Start screen for the Spotify Car Thing running [bridgething](https://bridgething.com).

![Metro start screen](docs/design/mock-orange.png)

The Car Thing's 800x480 panel is the WP7/WP8 phone screen turned sideways, so Metro keeps the Windows Phone grid,
type and motion almost pixel for pixel: flat accent tiles, live tiles, a sideways panorama, turnstile transitions
and lowercase headers. The full spec is in [docs/DESIGN.md](docs/DESIGN.md).

## Features

- **Start**: clock, now playing, notifications, settings and app tiles packed into the WP grid (small, medium,
  wide). One live tile moves at a time: the clock flips to the date, notifications cycle, and the now playing
  tile slides its album art up over itself.
- **Notifications**: an action center page with every notification, its time and the phone's own actions
  (reply, clear, archive...), plus clear all.
- **Apps**: alphabetical list with outlined jump letters. Built-in apps get white Metro glyphs.
- **Music**: large artwork, title, artist, album and the playing app, with previous, play/pause and next.
- **Settings**: theme (dark or light, 20 WP accents), brightness, paired phones and restart, on the device.
- **Themes**: the 20 WP8 accents on a dark or light background, set on the device or in the companion app.
- **Volume flyout** and a **button guide** in the WP chrome-band style.

## Controls

| Control | Action |
|---|---|
| Knob turn | move focus tile by tile; on music, volume (or keeps navigating, see settings) |
| Knob press | open the focused tile or press the focused button; on music, play / pause |
| Tap | open; drag pans the panorama |
| Back | return to start |
| 1 / 2 / 3 | start / apps / music |
| 4 | play / pause |
| Hold 1-4 | show what every button does |
| M | start and music, back and forth |
| M x5, or hold M | bridgething's own return-home gesture |

## Settings

On the device, the settings tile opens the settings page. In the bridgething companion app, Metro's settings page
offers:

| Setting | Choices | Default |
|---|---|---|
| Background | dark, light | dark |
| Accent colour | lime, green, emerald, teal, cyan, cobalt, indigo, violet, pink, magenta, crimson, red, orange, amber, yellow, brown, olive, steel, mauve, sienna | cyan |
| Knob on the music screen | volume, scroll | volume |

A theme picked on the device is kept in Metro's device storage and wins until the same setting is changed in
the companion app. Metro turns off the system volume bar while it is on screen and draws its own flyout.

## Install

From the bridgething store once the catalog is published, or straight from this repo onto a connected Car Thing:

```sh
bun install
bun run push        # build, copy to the device, make Metro the home screen
```

`bun run push --release` hands the home screen back to bridgething's hub.

## Develop

```sh
bun run dev            # dev server against a connected Car Thing
bun run dev:device     # the dev server on the Car Thing's own screen, with hot reload
bun run check          # typecheck, build, bundle and validate the catalog (what CI runs)
```

### Without a device

Open the dev server at an 800x480 viewport with `?mock` for sample apps, music, notifications and settings.
`accent`, `theme` and `knob` preview options: `http://localhost:5173/?mock&accent=orange&theme=light&knob=scroll`.

Against bridgething's host daemon (`just dev-daemon` in the bridgething repo), drop `?mock`:
`BRIDGETHING_DAEMON_URL=ws://127.0.0.1:8891 bun run dev`. The host daemon has no phone, so music and
notifications stay empty.

| Control | Browser stand-in |
|---|---|
| Knob turn | horizontal scroll, mouse wheel or arrow keys |
| Knob press | Enter |
| Back | Escape |
| Presets, M | keys `1` to `4`, `m` |

### Layout

```
apps/bridgething-metro/
  public/manifest.json   id, role: launcher, config (theme, accent, music_knob), overlays (volume off)
  settings/              companion-app settings page (single file, runs on the phone)
  src/
    App.tsx              panorama, focus, scrolling, launch motion
    components/          sections, tiles, flyouts, icons
    hooks/               useLauncher (live client) / useMockLauncher, useDevice, input, drag, live tiles
    lib/                 grid packing, theme, player merging, notifications, app names and glyphs
    types.ts
docs/                    design spec, mocks, theme sheet
```

### Device notes

Things that only show up on the Car Thing:

- `dev:device` serves over plain http, so `crypto.randomUUID` is missing; request ids are built from
  `crypto.getRandomValues`.
- The iPhone sends locales like `en_US`, which `Intl` rejects; time formatting falls back step by step.
- iOS now-playing sends only changed fields, so the launcher keeps the last known artist and artwork.
- The daemon caches manifests: after changing `public/manifest.json` on an installed app, restart the daemon.

## Ship

```sh
bun run bump bridgething-metro patch -m "What changed"
git commit -am "bridgething-metro: what changed" && git push
```

Pushing to main builds the app and regenerates the catalog at
`https://williamtcastro.github.io/bridgething-metro/catalog.v1.json` (GitHub Pages from the `gh-pages` branch),
which can be submitted to <https://bridgething.com/apps>.

## Credits

- Type: [Selawik](https://github.com/microsoft/Selawik), Microsoft's open Segoe UI stand-in (OFL-1.1).
- Icons: [Fluent UI System Icons](https://github.com/microsoft/fluentui-system-icons) (MIT) and
  [Simple Icons](https://simpleicons.org) (CC0) for the Spotify mark. Brand marks belong to their owners.
- Motion values: the Windows Phone Toolkit (Ms-PL) and WinJS (MIT).
- Not affiliated with Microsoft or Spotify. Segoe fonts and the Windows logo are not used.

`.claude/skills/bridgething/` holds the `/bridgething` agent skill (`bun run skills` refreshes it).
