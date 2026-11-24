# Changelog

## v1.7.0

Background pipeline rewrite and theme-following accents:

- Backgrounds now live as files at `~/.luckydraw/backgrounds/<profile>.img`; `state.json` no longer embeds data URLs, fixing the `EOF` error and state bloat when switching backgrounds
- Adaptive compression: jpeg/png/webp up to 640KB are stored verbatim instead of being re-encoded as JPEG, so flat and anime art no longer turns muddy
- Background reads sniff the MIME type from magic bytes, so a stale `.mime` file cannot produce wrong colors
- Presets are discovered from `src/assets/backgrounds/*.webp` with a manifest for labels and fallback accents; adding a preset needs no code change, and an optional `-thumb` variant feeds thumbnails and accent sampling
- Selecting a preset no longer deletes the uploaded custom image: a `customActive` flag plus a "Custom" tile lets you switch back anytime; only the trash button and profile switching delete it
- Accent extraction now also rewrites the neutral ramps (`--heroui-content*`, `--heroui-default-*`); `.text-gradient-primary` and the danmaku feed gradient follow the accent, removing the jarring mismatch
- `Backdrop` cross-fades between images, fixing images that stayed transparent when `onLoad` was skipped on cache hits
- Danmaku: no connection while a room is offline, auto-connect once it goes live; empty states are centered
- The account card cover uses the original image unscaled; `CachedImage` sets `referrerPolicy="no-referrer"` to fix Bilibili hotlink protection
- Desktop window minimum size is 960×720; `/api/*` is mounted on the desktop asset server so binary payloads travel over HTTP instead of the size-limited IPC bridge
- Background uploads are validated: oversized bodies return `413`, non-images error out instead of being stored corrupt
- Settings tabs mount once and toggle visibility, cutting tab-switch lag; profile and room lists share one style and dropped section blurbs
- Lottery page no longer clips in browser dev mode; the start button is now a rounded square
- Added `.npmrc` (`legacy-peer-deps`) to resolve the HeroUI / Tailwind 4 peer conflict

## v1.6.0

UI rework and live viewing:

- The lottery page is now a single screen: stream player, room list, danmaku feed and control bar; the sidebar collapses in narrow windows
- New live danmaku panel following the selected room, with Bilibili emotes (including shortcut ones like `[oh]`), bottom sticking, pause on scroll-up and automatic resume after 3 idle seconds
- New embedded HLS player with a clock watchdog: a silent stall triggers a soft resume first, then a player rebuild with a fresh URL, backing off up to 20s
- Theming reworked into "mode + background preset": spring-festival and beach backdrops are optional, and the accent is sampled from the active image
- UI moved to Tailwind + HeroUI; scrollbars appear only while scrolling; when results show the stage keeps its aspect ratio and the winners list fills the remaining height inside the card
- Image pipeline: throttled pre-decode queue, Bilibili CDN thumbnails and visibility-gated mounting, cutting main-thread jank during danmaku bursts
- Frontend split by feature (session / lottery / rooms / profiles / settings / history); backend services split into room / danmaku_feed / emote / history
- New browser dev bridge: `/api/*` and Wails IPC share one set of business code, and the standalone `cmd/devbridge` reuses the same routes
- Login page gained card tilt and a theme toggle; the QR state machine covers expired and scanned-awaiting-confirmation states
- An empty keyword collects every danmaku; adding a room accepts a pasted live-room link

## v1.5.0

- Live participant count on the lottery screen, with an explicit waiting hint
- An empty keyword collects all danmaku; the screen labels the active mode, and no draw happens without participants
- Failed room connections are reported instead of silently "accumulating"
- Copy the winner list in one click from the result screen
- History records the real keyword and winner count, capped at the last 100 entries
- Transient network errors no longer log you out; config files are written with 0600

## v1.4.0

- `getDanmuInfo` now uses WBI signing, fixing `-352` responses that prevented danmaku connections
- The danmaku handshake now includes `uid` and `buvid3`, preventing nickname masking and the `uid = 0` collapse of all participants into one
- Danmaku hosts use `wss_port` (2245); the legacy `getConf` fallback keeps the token and host list
- Fixed a stray `types` entry in the frontend `tsconfig.json` that surfaced type errors when deps or bindings were missing

## v1.3.0

- Draw history expands to show the winner list, sorted newest first with in-card scrolling
- Room input accepts a live-room link and resolves the room ID automatically

## v1.2.0

- Windows EXE / NSIS installers built automatically and published with GitHub Releases
- Fixed Windows packaging: npm proxy hangs and NSIS / WebView2 path issues

## v1.1

- Draw history is recorded automatically and bound to its profile — switching profiles switches history
- Export the winner list to Markdown in one click, named `keyword-count-time`
- Long winner lists scroll inside the card; the lottery page no longer overflows

## v1.0

- Docs site launched, bilingual (zh / en), auto-deployed to GitHub Pages
- Architecture and data-flow redrawn with Mermaid; docs fully rewritten
- Fixed message-toast jitter and a QR-login cookie-fetch bug

## v0.9

- Added the beach theme, completing the four-theme set (light / dark / spring-festival / beach)
- Light / Dark rebuilt to the Cirrus spec — pure CSS, pill corners, layered shadows
- Built-in zh / en switch, defaulting to Chinese

## v0.8

- Upgraded to Wails v3, switched to a Taskfile build
- Backend rewritten in layers: app → service → domain + event; service no longer depends on Wails
- Removed the unused dynamic-lottery dead code
- `live:user_join` events drive the participant count in real time

## v0.7

- Multiple draw profiles, each with its own keyword, rooms and background — switch with one click
- QR-code login, alongside Cookie login
- Auto-reconnect on dropped danmaku connections

## v0.6

- First release: danmaku monitoring, keyword matching, UID dedup, random draw
