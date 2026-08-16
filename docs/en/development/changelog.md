# Changelog

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
