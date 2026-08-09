# 数据流与事件

## 抽奖流程

```
用户点击开始
  → ConnectLiveRooms(roomIDs)        连接各直播间弹幕 WebSocket
  → StartLiveLottery(keyword)        设 OnUserJoin 回调，开始监听
  → DanmakuClient 收到 DANMU_MSG
  → 解析弹幕 → 关键词匹配
  → UID 去重（首次出现才入池）
  → OnUserJoin(user)
  → emitter.Emit("live:user_join", user)
  → 前端 Events.On('live:user_join') → GetParticipantCount()
```

`live:user_join` 事件实时驱动参与人数更新；另有 1000ms 轮询兜底对账。

## 停止与开奖

```
用户点击停止
  → StopLiveLottery()                停止弹幕监听
  → DrawWinners(count)               Fisher-Yates 洗牌取前 count 个
  → 返回 Winner[] JSON
  → 前端解析 → WinnerDisplay 展示
```

## 登录流程

**Cookie 登录：**

```
Login(cookie) → GetMyInfo 校验 → 持久化 config.json
```

**扫码登录：**

```
GetQRCode() → 返回 {qrcode_key, url}
  → qrcode 库渲染二维码
  → 每 2000ms 轮询 CheckQRCodeStatus(qrcode_key)
    → code 0：成功 → 从 poll 响应 Set-Cookie 头收集 Cookie → LoginWithQRCode(cookie) 校验 → 持久化
    → 86038：过期 → 提示重新生成
    → 86090：已扫码待确认 → 提示
```

## Profile 事件

- `SwitchProfile(id)` → 持久化 → 发 `profile:switched`（payload：激活的 ProfileConfig JSON）。
- `CreateProfile(name)` → 持久化 → 发 `profile:created`（payload：新建的 ProfileConfig JSON）。ID 格式 `pf_<unixnano>`。

## 配置持久化

| 文件 | 内容 |
| --- | --- |
| `~/.luckydraw/config.json` | `{Cookie}` |
| `~/.luckydraw/state.json` | `{Profiles, ActiveProfile}` |

关键词与中奖数变更后 500ms 防抖自动调用 `SaveProfileConfig` 写入 `state.json`。
