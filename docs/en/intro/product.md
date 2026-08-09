# Product

BiliLuckyDraw is a desktop app for Bilibili live-stream lucky draws, built with Wails v3 (Go backend + React 18 + TypeScript frontend). It runs as a single 1200×800 webview window; on macOS, closing the last window quits the app.

- **Repository**: [aDarkMaker/BiliLuckyDraw](https://github.com/aDarkMaker/BiliLuckyDraw)
- **Releases**: [github.com/aDarkMaker/BiliLuckyDraw/releases](https://github.com/aDarkMaker/BiliLuckyDraw/releases)
- **License**: MIT © 2025 aDarkMaker

## What it does

- Connects to one or more Bilibili live rooms and monitors danmaku in real time
- Collects participants whose danmaku contains a configured keyword (deduplicated by UID)
- Draws N winners at random (Fisher-Yates shuffle)
- Supports Cookie login and QR-code login
- Saves multiple draw profiles and switches between them
- Ships four themes (light / dark / spring-festival / beach) with custom backgrounds

## Screenshots

| | |
| --- | --- |
| ![Home](/img/home.png) | ![Login](/img/login.png) |
| Home (idle) | Cookie login |
| ![QR code](/img/prcode.png) | ![Settings](/img/settings.png) |
| QR-code login | Settings |
| ![Winners](/img/winners.png) | |
| Winners | |

## Tech stack

| Layer | Tech |
| --- | --- |
| Backend | Wails v3 (v3.0.0-alpha.95) · Go 1.25 · Gorilla WebSocket |
| Frontend | React 18 · TypeScript 5 · Vite · Bun |
| Build | Task (Taskfile.yml) · wails3 CLI |
