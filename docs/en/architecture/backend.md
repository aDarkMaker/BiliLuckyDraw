# Backend Architecture

## Entry: main.go

`application.New` registers a single service `application.NewService(app.New())`, embeds the frontend dist and app icon, and creates a 1200×800 webview window (URL `/`). On macOS, closing the last window quits the app.

## app layer (Wails boundary)

`AppService` is the single service exposed to the frontend. It holds three service impls (`auth`/`live`/`profile`) and `app *application.App`.

- `ServiceStartup`: loads `~/.luckydraw/config.json` and `state.json`, obtains the app via `application.Get()`, builds a `wailsEmitter`, and injects it into the `live`/`profile` services (`auth` is not injected).
- `ServiceShutdown`: calls `live.Stop()`.
- `ServiceName`: returns `"App"`.

`wailsEmitter` implements the `event.Emitter` interface, delegating to `application.App.Event.Emit` so services never import Wails directly. Each exported method thinly delegates to its service impl with an unchanged signature.

## service layer (pure business)

| Service | Dependencies | Events |
| --- | --- | --- |
| `AuthService` | `*bili.Client`, `*config.Config`, configPath | none (validates Cookie on autoLogin) |
| `LiveLotteryService` | `*live.LiveLottery`, `Emitter`, `func()*bili.Client` | `live:user_join` |
| `ProfileService` | `*config.RuntimeState`, statePath, `Emitter` | `profile:switched`, `profile:created` |

- `LiveLotteryService.StartLiveLottery` sets the `liveLottery.OnUserJoin` callback, which calls `emitter.Emit("live:user_join", user)`.
- `ProfileService.SwitchProfile`/`CreateProfile` persist then emit. Profile ID format is `pf_%d` (`time.Now().UnixNano()`).

## event / domain

- `event.Emitter` interface: `Emit(name string, data ...any) bool`, implemented by `app.wailsEmitter`.
- `domain` defines the `AuthService`/`LiveLotteryService`/`ProfileService` interfaces + the `AccountInfo` DTO; serves as a contract document.

## config

| Type | Contents | File |
| --- | --- | --- |
| `Config` | `{Cookie}` | `~/.luckydraw/config.json` |
| `RuntimeState` | `{Profiles, ActiveProfile}` | `~/.luckydraw/state.json` |
| `ProfileConfig` | `{ID, Name, BackgroundImage, WatchedRooms, Keyword, WinnerCount}` | (inside state.json) |

`migrateOldState` handles the legacy single-Profile format.

## bili / live / login

- `bili`: Bilibili HTTP API client (`Client`, `GetMyInfo` → `UserInfo{Mid,Name,Face}`, `DefaultHTTPClient`).
- `live`: live-stream danmaku WebSocket binary protocol (`DanmakuClient`, reconnect/backoff, 16-byte packet framing, `OperationJoin` auth, heartbeat) + draw aggregation (`LiveLottery`, `OnUserJoin` callback, `Draw` Fisher-Yates shuffle, UID-deduped participant pool). Types: `DanmakuUser{UID,Username,Count}`, `DanmakuMessage`.
- `login`: Bilibili QR-code login flow (`QRLogin.GetQRCode`, `CheckQRCodeStatus` polling; status `0` success / `86038` expired / `86090` scanned, awaiting confirmation).

## Frontend-visible methods

| Auth | Live lottery | Profile |
| --- | --- | --- |
| Login | ConnectLiveRooms | GetProfiles |
| GetQRCode | StartLiveLottery | SwitchProfile |
| CheckQRCodeStatus | StopLiveLottery | CreateProfile |
| LoginWithQRCode | DrawWinners | DeleteProfile |
| IsLoggedIn | GetParticipantCount | RenameProfile |
| GetAccountInfo | IsLiveLotteryRunning | SaveProfileConfig |
| Logout | | SetBackgroundImage |
| | | GetBackgroundImage |
| | | AddWatchedRoom |
| | | RemoveWatchedRoom |
| | | GetWatchedRooms |
