# Features

## Live-stream lucky draw

`ConnectLiveRooms(roomIDs)` opens danmaku WebSockets for the given rooms. `StartLiveLottery(keyword)` starts monitoring; each danmaku containing the keyword adds its sender to the participant pool (deduplicated by UID, first occurrence only). `DrawWinners(count)` shuffles the pool with Fisher-Yates and returns the top `count` winners.

## Multiple login methods

- **Cookie login**: paste a Bilibili Cookie string → `Login` validates via `GetMyInfo` and persists it.
- **QR-code login**: `GetQRCode` returns a URL rendered into a QR image; the app polls `CheckQRCodeStatus` every 2000ms (status `0` success / `86038` expired / `86090` scanned, awaiting confirmation).

## Multi-profile

A **Profile** is a draw-configuration set (not a Bilibili account). Each `ProfileConfig` holds:

| Field | Meaning |
| --- | --- |
| `ID` | `pf_<unixnano>` |
| `Name` | Profile label |
| `BackgroundImage` | Custom background path |
| `WatchedRooms` | Monitored room IDs |
| `Keyword` | Danmaku keyword |
| `WinnerCount` | Number of winners (1–9999) |

Profiles persist to `~/.luckydraw/state.json`. Switch or create profiles in Settings.

## Theme system

Four built-in themes:

| Theme | Background image |
| --- | --- |
| light | none |
| dark | none |
| spring-festival | bundled |
| beach | bundled |

Theme persists in `localStorage 'luckydraw-theme'`. On first launch, light/dark follows `prefers-color-scheme`. All theme backgrounds are preloaded on mount to eliminate switch lag. A theme background takes priority over a custom background.

## Customizable

Per profile: keyword, winner count (1–9999), watched rooms, and a custom background image. Theme background (if any) overrides the custom background.
