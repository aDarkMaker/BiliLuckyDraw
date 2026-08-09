# Data Flow & Events

## Draw flow

```mermaid
flowchart LR
    Start([Click Start]) --> Connect[ConnectLiveRooms connect danmaku WS]
    Connect --> Listen[StartLiveLottery set OnUserJoin and listen]
    Listen --> Danmaku[DANMU_MSG received]
    Danmaku --> Parse[Parse danmaku and match keyword]
    Parse --> Dedup{UID seen?}
    Dedup -->|First| Join[OnUserJoin callback]
    Dedup -->|Already| Danmaku
    Join --> Emit["emitter.Emit live:user_join"]
    Emit --> Front[Frontend updates participant count]

classDef proc fill:var(--vp-c-brand-soft),stroke:var(--vp-c-brand-1),color:var(--vp-c-text-1);
classDef io fill:transparent,stroke:var(--vp-c-brand-1),color:var(--vp-c-text-1);
class Connect,Listen,Parse,Join,Emit,Front proc;
class Start,Dedup io;
```

The `live:user_join` event drives participant-count updates in real time; a 1000ms polling fallback reconciles.

## Stop & draw

```mermaid
flowchart LR
    Stop([Click Stop]) --> Quit[StopLiveLottery stop listening]
    Quit --> Draw["DrawWinners Fisher-Yates shuffle, take top N"]
    Draw --> JSON[Return Winner array JSON]
    JSON --> Show[Frontend renders winner list]

classDef proc fill:var(--vp-c-brand-soft),stroke:var(--vp-c-brand-1),color:var(--vp-c-text-1);
classDef io fill:transparent,stroke:var(--vp-c-brand-1),color:var(--vp-c-text-1);
class Quit,Draw,JSON,Show proc;
class Stop io;
```

## Login flow

**Cookie login:**

```mermaid
flowchart LR
    A[Paste Cookie] --> B[Login calls GetMyInfo to validate]
    B --> C{Valid?}
    C -->|Yes| D[Persist to config.json]
    C -->|No| E[Show login-failed prompt]

classDef proc fill:var(--vp-c-brand-soft),stroke:var(--vp-c-brand-1),color:var(--vp-c-text-1);
classDef io fill:transparent,stroke:var(--vp-c-brand-1),color:var(--vp-c-text-1);
class B,D,E proc;
class A,C io;
```

**QR-code login:**

```mermaid
flowchart LR
    Q1[GetQRCode returns qrcode_key and url] --> Q2[qrcode lib renders the QR image]
    Q2 --> Q3[Poll CheckQRCodeStatus every 2000ms]
    Q3 --> Q4{Status code}
    Q4 -->|86038 expired| Q5[Prompt to regenerate]
    Q4 -->|86090 awaiting confirm| Q3
    Q4 -->|0 success| Q6[Collect Cookie from Set-Cookie header]
    Q6 --> Q7[LoginWithQRCode validates and persists]

classDef proc fill:var(--vp-c-brand-soft),stroke:var(--vp-c-brand-1),color:var(--vp-c-text-1);
classDef io fill:transparent,stroke:var(--vp-c-brand-1),color:var(--vp-c-text-1);
class Q1,Q2,Q6,Q7,Q5 proc;
class Q3,Q4 io;
```

## Profile events

```mermaid
flowchart LR
    S["SwitchProfile(id)"] --> SP[persist] --> SE["emit profile:switched"]
    C["CreateProfile(name)"] --> CP["persist, ID = pf_unixnano"] --> CE["emit profile:created"]

classDef proc fill:var(--vp-c-brand-soft),stroke:var(--vp-c-brand-1),color:var(--vp-c-text-1);
classDef io fill:transparent,stroke:var(--vp-c-brand-1),color:var(--vp-c-text-1);
class SP,SE,CP,CE proc;
class S,C io;
```

Both payloads are the corresponding ProfileConfig JSON.

## Config persistence

| File | Contents |
| --- | --- |
| `~/.luckydraw/config.json` | `{Cookie}` |
| `~/.luckydraw/state.json` | `{Profiles, ActiveProfile}` |

Keyword and winner-count changes are debounced 500ms, then `SaveProfileConfig` writes them to `state.json`.
