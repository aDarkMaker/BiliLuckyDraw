# Data Flow & Events

## Draw flow

```
User clicks Start
  → ConnectLiveRooms(roomIDs)        connect each room's danmaku WebSocket
  → StartLiveLottery(keyword)        set OnUserJoin callback, start listening
  → DanmakuClient receives DANMU_MSG
  → parse danmaku → keyword match
  → UID dedup (first occurrence enters the pool only)
  → OnUserJoin(user)
  → emitter.Emit("live:user_join", user)
  → frontend Events.On('live:user_join') → GetParticipantCount()
```

The `live:user_join` event drives participant-count updates in real time; a 1000ms polling fallback reconciles.

## Stop & draw

```
User clicks Stop
  → StopLiveLottery()                stop danmaku listening
  → DrawWinners(count)               Fisher-Yates shuffle, take top count
  → return Winner[] JSON
  → frontend parses → WinnerDisplay renders
```

## Login flow

**Cookie login:**

```
Login(cookie) → GetMyInfo validates → persist to config.json
```

**QR-code login:**

```
GetQRCode() → returns {qrcode_key, url}
  → qrcode lib renders the QR image
  → poll CheckQRCodeStatus(qrcode_key) every 2000ms
    → code 0: success → LoginWithQRCode(loginURL) parses Cookie → validates → persist
    → 86038: expired → prompt to regenerate
    → 86090: scanned, awaiting confirmation → prompt
```

## Profile events

- `SwitchProfile(id)` → persist → emit `profile:switched` (payload: the activated ProfileConfig JSON).
- `CreateProfile(name)` → persist → emit `profile:created` (payload: the new ProfileConfig JSON). ID format `pf_<unixnano>`.

## Config persistence

| File | Contents |
| --- | --- |
| `~/.luckydraw/config.json` | `{Cookie}` |
| `~/.luckydraw/state.json` | `{Profiles, ActiveProfile}` |

Keyword and winner-count changes are debounced 500ms, then `SaveProfileConfig` writes them to `state.json`.
