# Product

BiliLuckyDraw is a desktop app for running lucky draws in Bilibili live streams. Once connected to a room, it listens to danmaku in real time: viewers who send a danmaku containing a configured keyword are entered into the draw, and winners are picked at random from all participants. The whole process is automatic — no manual list-keeping, fair and transparent.

It's built for streamers who want to run interactive giveaways during a stream — whether it's a daily thank-you, a fan-festival event or a holiday celebration, you can start a draw in seconds.

- **Repository**: [aDarkMaker/BiliLuckyDraw](https://github.com/aDarkMaker/BiliLuckyDraw)
- **Releases**: [github.com/aDarkMaker/BiliLuckyDraw/releases](https://github.com/aDarkMaker/BiliLuckyDraw/releases)
- **License**: MIT © 2025 aDarkMaker

## What it does

- Monitors danmaku in one or more live rooms in real time
- Enters viewers who send the keyword into the draw, deduplicated by UID (multiple messages in the same room count once)
- One-click draw — randomly picks the configured number of winners
- Two login methods: paste a Cookie, or scan a QR code with the mobile app
- Multiple draw configs, switchable any time and remembered across restarts
- Four themes (light / dark / spring-festival / beach), switchable at runtime

## Screenshots

| Home (idle) | Cookie login | QR-code login |
| --- | --- | --- |
| ![Home](/img/home.png) | ![Login](/img/login.png) | ![QR code](/img/prcode.png) |

| Settings | Winners | Draw history |
| --- | --- | --- |
| ![Settings](/img/settings.png) | ![Winners](/img/winners.png) | ![Draw history](/img/history.png) |

## Tech stack

| Layer | Tech |
| --- | --- |
| Backend | Wails v3 (v3.0.0-alpha.95) · Go 1.25 |
| Frontend | React 18 · TypeScript 5 · Vite · Bun |
| Transport | WebSocket · Gorilla |
