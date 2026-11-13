# Data Flow & Events

## Draw flow

```mermaid
flowchart LR
    Start([Click Start]) --> Connect["ConnectLiveRooms<br/>one DanmakuClient per room"]
    Connect --> Listen["StartLiveLottery<br/>returns connected / total / failures"]
    Listen --> Danmaku[DANMU_MSG received]
    Danmaku --> Parse[Parse nickname UID and text]
    Parse --> Match{Keyword matches?}
    Match -->|No| Danmaku
    Match -->|Yes| Dedup{UID seen?}
    Dedup -->|First| Join[OnUserJoin callback]
    Dedup -->|Already| Danmaku
    Join --> Emit["emitter.Emit live:user_join"]
    Emit --> Front[Frontend updates participant count]
```

An empty keyword makes `Match` always pass — "collect everything". Rooms that failed to connect appear in `failures` and are named in the UI instead of being silently treated as collecting.

`live:user_join` drives live counts; `useLottery` also polls every 2s as a fallback, reconciling run state and participant count after a missed event or a page reload.

## Stop and draw

```mermaid
flowchart LR
    Stop([Click Stop]) --> Quit[StopLiveLottery closes every connection]
    Quit --> Draw["DrawWinners Fisher-Yates, take top N"]
    Draw --> JSON[Return Winner array JSON]
    JSON --> Hist["profile.AddHistory writes to active profile"]
    Hist --> Show[Frontend renders the winner list]
```

A history write failure never blocks the result: the error is stashed in `lastHistoryError` and read once by the frontend via `GetLastHistoryError`.

## Danmaku panel

```mermaid
sequenceDiagram
    participant P as DanmakuPanel
    participant H as useDanmakuFeed
    participant A as /api/danmaku
    participant S as DanmakuFeedService
    participant L as live.DanmakuClient

    P->>H: mount with roomID
    H->>A: POST /watch {room_id}
    A->>S: Watch(roomID)
    S->>L: new connection (old one stopped first)
    loop every 700ms
        H->>A: GET /danmaku?since=cursor
        A->>S: GetDanmakuFeed(since)
        S-->>H: {cursor, lines}
        H->>H: 200ms batching, keep latest 120 lines
    end
    P->>H: unmount / switch room
    H->>A: DELETE /danmaku
```

The emote map is fetched once (`/api/danmaku/emotes`); the server caches it for 6 hours and layers the current room's emotes on top.

## Stream playback

```mermaid
flowchart LR
    R[room_stage mounts] --> Info[room info already provided by useRoomInfo]
    Info --> Live{live_status == 1?}
    Live -->|No| Cover[show cover]
    Live -->|Yes| Play[roomApi.playUrl fetches HLS URL]
    Play --> HLS[loadHls lazy-loads hls.js]
    HLS --> Watchdog[check currentTime every 1.5s]
    Watchdog -->|5s without progress| Soft[video.play soft resume]
    Soft -->|still stuck| Rebuild[destroy instance + refetch URL]
    Rebuild --> HLS
```

## Login flows

**Cookie login:**

```mermaid
flowchart LR
    A[Paste Cookie] --> B[Login validates via GetMyInfo]
    B --> C{Valid?}
    C -->|Yes| D[write config.json with 0600]
    C -->|No| E[show login-failed prompt]
```

**QR-code login:**

```mermaid
flowchart LR
    Q1[GetQRCode returns qrcode_key and url] --> Q2[qrcode renders a data URL]
    Q2 --> Q3[Poll CheckQRCodeStatus every 2s]
    Q3 --> Q4{Status code}
    Q4 -->|86038 expired| Q5[prompt to refresh]
    Q4 -->|86090 awaiting confirm| Q3
    Q4 -->|0 success| Q6[assemble Cookie from Set-Cookie]
    Q6 --> Q7[LoginWithQRCode validates and persists]
```

## Profile events

```mermaid
flowchart LR
    S["SwitchProfile(id)"] --> SP[persist] --> SE["emit profile:switched"]
    C["CreateProfile(name)"] --> CP["persist, ID = pf_unixnano"] --> CE["emit profile:created"]
```

Both payloads are the `ProfileConfig` JSON string.

## Config persistence

| File | Contents |
| --- | --- |
| `~/.luckydraw/config.json` | `{Cookie}` |
| `~/.luckydraw/state.json` | `{Profiles, ActiveProfile}` |

- Keyword and winner-count changes are debounced 400ms before `SaveProfileConfig`.
- Rooms, background, profile CRUD and draw history persist immediately.
- Both files are written with `0600` inside a `0700` directory; the legacy single-profile layout migrates on read.
