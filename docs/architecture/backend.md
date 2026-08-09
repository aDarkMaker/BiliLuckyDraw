# 后端架构

## 入口 main.go

`application.New` 注册一个服务 `application.NewService(app.New())`，内嵌前端 dist 与应用图标，创建 1200×800 webview 窗口（URL `/`），macOS 关闭最后一个窗口即退出。

## app 层（Wails 边界）

`AppService` 是暴露给前端的唯一服务，持有 `auth`/`live`/`profile` 三个 service impl 与 `app *application.App`。

- `ServiceStartup`：加载 `~/.luckydraw/config.json` 与 `state.json`，通过 `application.Get()` 获取 app，构造 `wailsEmitter`，注入 `live`/`profile` service（`auth` 不注入）。
- `ServiceShutdown`：调用 `live.Stop()`。
- `ServiceName`：返回 `"App"`。

`wailsEmitter` 实现 `event.Emitter` 接口，委托 `application.App.Event.Emit`，让 service 不直接依赖 Wails。每个导出方法薄委托对应 service，签名不变。

## service 层（纯业务）

| Service | 依赖 | 事件 |
| --- | --- | --- |
| `AuthService` | `*bili.Client`、`*config.Config`、configPath | 无（autoLogin 时校验 Cookie） |
| `LiveLotteryService` | `*live.LiveLottery`、`Emitter`、`func()*bili.Client` | `live:user_join` |
| `ProfileService` | `*config.RuntimeState`、statePath、`Emitter` | `profile:switched`、`profile:created` |

- `LiveLotteryService.StartLiveLottery` 设置 `liveLottery.OnUserJoin` 回调，回调内 `emitter.Emit("live:user_join", user)`。
- `ProfileService` 的 `SwitchProfile`/`CreateProfile` 持久化后发事件。Profile ID 格式 `pf_%d`（`time.Now().UnixNano()`）。

## event / domain

- `event.Emitter` 接口：`Emit(name string, data ...any) bool`，由 `app.wailsEmitter` 实现。
- `domain` 定义 `AuthService`/`LiveLotteryService`/`ProfileService` 接口 + `AccountInfo` DTO，契约文档作用。

## config

| 类型 | 内容 | 文件 |
| --- | --- | --- |
| `Config` | `{Cookie}` | `~/.luckydraw/config.json` |
| `RuntimeState` | `{Profiles, ActiveProfile}` | `~/.luckydraw/state.json` |
| `ProfileConfig` | `{ID, Name, BackgroundImage, WatchedRooms, Keyword, WinnerCount}` | （state.json 内） |

`migrateOldState` 兼容旧版单 Profile 格式。

## bili / live / login

- `bili`：B 站 HTTP API 客户端（`Client`、`GetMyInfo` → `UserInfo{Mid,Name,Face}`、`DefaultHTTPClient`）。
- `live`：直播弹幕 WebSocket 二进制协议（`DanmakuClient`，重连/退避、16 字节包帧、`OperationJoin` 鉴权、心跳）+ 抽奖聚合（`LiveLottery`，`OnUserJoin` 回调、`Draw` Fisher-Yates 洗牌、按 UID 去重的参与者池）。类型：`DanmakuUser{UID,Username,Count}`、`DanmakuMessage`。
- `login`：B 站扫码登录流程（`QRLogin.GetQRCode`、`CheckQRCodeStatus` 轮询；状态码 0 成功 / 86038 过期 / 86090 已扫码待确认）。

## 前端可见方法

| 认证 (auth) | 直播抽奖 (live) | Profile (profile) |
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
