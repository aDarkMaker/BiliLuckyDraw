# 数据流与事件

## 抽奖流程

```mermaid
flowchart LR
    Start([点击开始]) --> Connect["ConnectLiveRooms<br/>为每个频道建 DanmakuClient"]
    Connect --> Listen["StartLiveLottery<br/>返回 connected / total / failures"]
    Listen --> Danmaku[收到 DANMU_MSG]
    Danmaku --> Parse[解析昵称 UID 与内容]
    Parse --> Match{口令匹配?}
    Match -->|不匹配| Danmaku
    Match -->|匹配| Dedup{UID 已存在?}
    Dedup -->|首次| Join[OnUserJoin 回调]
    Dedup -->|已存在| Danmaku
    Join --> Emit["emitter.Emit live:user_join"]
    Emit --> Front[前端更新参与人数]
```

口令为空时 `Match` 直接通过，即「全弹幕收集」。连接失败的频道会出现在 `failures` 里，前端提示具体房间号，而不是静默当作积累中。

`live:user_join` 驱动实时人数；`useLottery` 另有 2 秒轮询兜底，检查运行态与人数，处理事件丢失或页面刷新后的补对账。

## 停止与开奖

```mermaid
flowchart LR
    Stop([点击停止]) --> Quit[StopLiveLottery 停止所有连接]
    Quit --> Draw["DrawWinners Fisher-Yates 取前 N"]
    Draw --> JSON[返回 Winner 数组 JSON]
    JSON --> Hist["profile.AddHistory 写入当前配置"]
    Hist --> Show[前端展示中奖名单]
```

历史写入失败不阻塞展示：错误存进 `lastHistoryError`，前端通过 `GetLastHistoryError` 取一次并弹出提示。

## 弹幕面板

```mermaid
sequenceDiagram
    participant P as DanmakuPanel
    participant H as useDanmakuFeed
    participant A as /api/danmaku
    participant S as DanmakuFeedService
    participant L as live.DanmakuClient

    P->>H: 挂载 roomID
    H->>A: POST /watch {room_id}
    A->>S: Watch(roomID)
    S->>L: 新建连接（旧连接先停）
    loop 每 700ms
        H->>A: GET /danmaku?since=cursor
        A->>S: GetDanmakuFeed(since)
        S-->>H: {cursor, lines}
        H->>H: 200ms 合批，保留最近 120 行
    end
    P->>H: 卸载 / 换房间
    H->>A: DELETE /danmaku
```

表情映射单独取一次（`/api/danmaku/emotes`），服务端缓存 6 小时并叠加当前直播间表情。

## 直播播放

```mermaid
flowchart LR
    R[room_stage 挂载] --> Info[roomApi.info 已由 useRoomInfo 提供]
    Info --> Live{live_status == 1?}
    Live -->|否| Cover[显示封面]
    Live -->|是| Play[roomApi.playUrl 取 HLS 地址]
    Play --> HLS[loadHls 懒加载 hls.js]
    HLS --> Watchdog[每 1.5s 检查 currentTime]
    Watchdog -->|5s 无进展| Soft[video.play 软恢复]
    Soft -->|仍无进展| Rebuild[销毁实例 + 重新取地址]
    Rebuild --> HLS
```

## 登录流程

**凭证登录：**

```mermaid
flowchart LR
    A[粘贴 Cookie] --> B[Login 调 GetMyInfo 校验]
    B --> C{校验通过?}
    C -->|是| D[写入 config.json 0600]
    C -->|否| E[提示登录失败]
```

**扫码登录：**

```mermaid
flowchart LR
    Q1[GetQRCode 返回 qrcode_key 与 url] --> Q2[qrcode 库渲染为 data URL]
    Q2 --> Q3[每 2s 轮询 CheckQRCodeStatus]
    Q3 --> Q4{状态码}
    Q4 -->|86038 过期| Q5[提示重新获取]
    Q4 -->|86090 待确认| Q3
    Q4 -->|0 成功| Q6[取 Set-Cookie 拼出 Cookie]
    Q6 --> Q7[LoginWithQRCode 校验并持久化]
```

## Profile 事件

```mermaid
flowchart LR
    S["SwitchProfile(id)"] --> SP[落盘] --> SE["emit profile:switched"]
    C["CreateProfile(name)"] --> CP["落盘，ID = pf_unixnano"] --> CE["emit profile:created"]
```

payload 都是对应 `ProfileConfig` 的 JSON 字符串。

## 配置持久化

| 文件 | 内容 |
| --- | --- |
| `~/.luckydraw/config.json` | `{Cookie}` |
| `~/.luckydraw/state.json` | `{Profiles, ActiveProfile}` |

- 口令与中选人数变更后 400ms 防抖调用 `SaveProfileConfig`。
- 频道、背景、配置增删改与开奖历史立即落盘。
- 两个文件均以 `0600` 写入，目录 `0700`；旧版单配置格式在读取时自动迁移。
