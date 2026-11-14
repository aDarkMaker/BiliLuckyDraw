# Frontend Architecture

## Two-transport bridge

The frontend never assumes it runs inside the Wails window. `services/http.ts` probes `/api/lottery/status` once at startup:

```ts
const fallback = async <T>(remote: () => Promise<T>, http: () => Promise<T>): Promise<T> => {
	if (!bridgeProbed) await probeHTTPBridge();
	if (httpPreferred || !hasWailsRuntime()) {
		httpPreferred = true;
		return http();
	}
	try {
		return await remote();
	} catch (remoteError) {
		try {
			const value = await http();
			httpPreferred = true;
			return value;
		} catch (httpError) {
			throw new Error(describe(remoteError, httpError));
		}
	}
};
```

- **Remote branch** (`remote`) = the generated Wails bindings, `AppService.*`.
- **HTTP branch** (`http`) = `fetch('/api/...')`, proxied by Vite to the bridge port.

Once the probe succeeds the choice is pinned to HTTP. If both branches fail, the error carries the "local backend not running" hint.

Generated bindings live in `frontend/bindings/luckydraw/internal/app/`, produced by `wails3 generate bindings` — **never hand-edit**. Structured returns are JSON strings parsed with `parseJSON(raw, fallback)`.

## Pages and routing

```
main.tsx             Provider → BrowserRouter → App
App.tsx              not logged in → LoginPage; else DefaultLayout + Routes
layouts/default.tsx  sidebar + header + scroll area (quiet scrollbar)
features/session/login_page.tsx
features/lottery/lottery_page.tsx
features/settings/settings_page.tsx
```

Routes: `/` is the lottery page, `/settings` the settings page, anything else redirects to `/`.

## State: AppContext

`contexts/app.tsx` merges three hooks into one context:

| Hook | Owns |
| --- | --- |
| `useSession` | login state, account info, sign-in / sign-out |
| `useProfiles` | profile list, active profile, rooms, background, keyword and count (400ms debounce autosave) |
| `useLottery` | run state, participant count (2s poll), winners, start / stop / reset |

Components consume `useApp()`; `notify` and `logout` hang off the same object. When the profile background changes, `AppProvider` forwards it to `useTheme().setCustomImage`.

## Feature directories

| Directory | Contents |
| --- | --- |
| `features/session/` | `login_page`, `useQRLogin` (QR state machine), `useTilt` (card tilt), `login_backdrop` |
| `features/lottery/` | `lottery_page`, `control_bar` (keyword + count stepper), `action_panel`, `winners_panel`, `account_card`, `stat`, `useLottery` |
| `features/rooms/` | `room_stage` (HLS player + watchdog), `room_list`, `danmaku_panel`, `useDanmakuFeed`, `useRoomInfo`, `hls`, `emote` |
| `features/profiles/` | `useProfiles`, `api` |
| `features/settings/` | `settings_page` plus `account` / `appearance` / `profiles` / `rooms` / `history` sections |
| `features/history/` | `useHistory`, `history_record` |

## Shared components

| Component | Responsibility |
| --- | --- |
| `Panel` / `PanelHeader` / `PanelBody` | card container (`PanelBody` is a `forwardRef` so a scroll ref can attach) |
| `Icon` | renders single-color SVGs from `generated/icons.ts`, colored via `currentColor` |
| `CachedImage` | lazy mounting + CDN thumbnails + pre-decode, see below |
| `useQuietScroll` | sets `data-scrolling="true"` while scrolling and clears it after 700ms; pairs with `.scroll-quiet` to hide the bar |
| `Toaster` | pill-styled `react-hot-toast` wrapper |
| `Backdrop` | photo background with a tone-matched scrim, or the default gradient blobs |
| `ui.tsx` / `field.ts` | `PrimaryButton` / `GhostButton` / `IconButton` / `Row` / `Pill` and input classNames |

## Image pipeline

Image decode is what janks the main thread during danmaku bursts, so it is handled in three layers:

1. **CDN thumbnails** — `imageThumb(src, px)` rewrites Bilibili URLs to `@<2×px>w_<2×px>h_1c.webp`, so avatars never fetch the original.
2. **Throttled pre-decode** — `image_queue.ts` decodes with `new Image()` + `img.decode()` on idle, capped at 4 concurrent, so a burst cannot decode dozens of images at once.
3. **Visibility-gated mounting** — `CachedImage` observes the nearest scroll container (`scrollRoot` walks up for `overflow-y: auto|scroll`); rows outside the viewport never issue requests. Each new danmaku batch only warms the newest 6 avatars; older rows load when scrolled into view.

## Player and danmaku feed

`room_stage.tsx` owns HLS playback:

- hls.js is loaded on demand via `<script>` with a cached promise and warmed while idle.
- Errors are split into fatal and non-fatal; fatal ones rebuild at most 3 times, backing off 1.5s → 20s.
- **Clock watchdog** — every 1.5s it compares `currentTime`; after 5s without progress it attempts a `play()` soft resume, and if the clock still doesn't move it tears the instance down and rebuilds with a fresh play URL. This exists for silent stalls that never fire `error` or `stalled`.
- Switching rooms or unmounting must destroy the instance and clear every timer.

`danmaku_panel.tsx` owns scroll behavior:

- `stick = true` by default; new lines scroll to the bottom inside `requestAnimationFrame`.
- Scrolling up (more than 48px from the bottom) sets `stick = false` and arms a 3s idle timer.
- When the timer fires it restores sticking. A `writing` flag keeps programmatic scrolls from re-triggering the logic.
- Data comes from `useDanmakuFeed`: a 700ms poll with 200ms batching, keeping the latest 120 lines.

## Theme and accent

`theme/index.tsx` handles two things: light/dark mode and background presets.

- Mode is stored in `localStorage 'luckydraw.mode'`, defaults to `prefers-color-scheme`, and toggles `dark` / `light` on `documentElement.classList`.
- Presets are stored in `'luckydraw.preset'` as `none` / `spring-festival` / `beach`; a custom image wins. `background = customImage || presetImage(preset)`.
- `accent.ts` downsamples the background to 48×48 on a canvas, weights hue by saturation and mid-lightness, and generates the whole `--heroui-primary-50…900` ramp. Without a background it falls back to preset hues (344° default, 2° spring-festival, 218° beach).

## i18n

A lightweight in-house implementation, no react-i18next: `Lang = 'zh' | 'en'`, Chinese by default, stored in `localStorage 'luckydraw-lang'`. `t(key, params)` interpolates `{{param}}` and falls back zh → key. Dictionaries are `i18n/zh.json` and `i18n/en.json`; keep both key sets identical.

## Styling conventions

- Tailwind + HeroUI; every color goes through CSS variables (`--heroui-*`, `--surface`, `--well`, `--backdrop-tint`), never a literal in a component.
- `styles/globals.css` holds fonts, base layer and scrollbars; `theme.css` the theme variables; `inputs.css` input details.
- Layouts use `flex` with `min-h-0`; on the lottery page the stage stays fixed when results show, and the winners list takes the remaining height and scrolls inside.
