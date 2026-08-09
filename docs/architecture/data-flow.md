# 数据流与事件

## 抽奖流程

```mermaid
flowchart LR
    Start([点击开始]) --> Connect[ConnectLiveRooms 连接弹幕 WS]
    Connect --> Listen[StartLiveLottery 设 OnUserJoin 并监听]
    Listen --> Danmaku[收到 DANMU_MSG]
    Danmaku --> Parse[解析弹幕并匹配关键词]
    Parse --> Dedup{UID 已存在?}
    Dedup -->|首次| Join[OnUserJoin 回调]
    Dedup -->|已存在| Danmaku
    Join --> Emit["emitter.Emit live:user_join"]
    Emit --> Front[前端更新参与人数]
```

`live:user_join` 实时驱动参与人数更新；另有 1000ms 轮询兜底对账。

## 停止与开奖

```mermaid
flowchart LR
    Stop([点击停止]) --> Quit[StopLiveLottery 停止监听]
    Quit --> Draw["DrawWinners Fisher-Yates 洗牌取前 N"]
    Draw --> JSON[返回 Winner 数组 JSON]
    JSON --> Show[前端展示中奖名单]
```

## 登录流程

**Cookie 登录：**

```mermaid
flowchart LR
    A[粘贴 Cookie] --> B[Login 调 GetMyInfo 校验]
    B --> C{校验通过}
    C -->|是| D[持久化到 config.json]
    C -->|否| E[提示登录失败]
```

**扫码登录：**

```mermaid
flowchart LR
    Q1[GetQRCode 返回 qrcode_key 与 url] --> Q2[qrcode 库渲染二维码]
    Q2 --> Q3[每 2000ms 轮询 CheckQRCodeStatus]
    Q3 --> Q4{状态码}
    Q4 -->|86038 过期| Q5[提示重新生成]
    Q4 -->|86090 待确认| Q3
    Q4 -->|0 成功| Q6[收集 Set-Cookie 头 Cookie]
    Q6 --> Q7[LoginWithQRCode 校验并持久化]
```

## Profile 事件

```mermaid
flowchart LR
    S["SwitchProfile(id)"] --> SP[持久化] --> SE["emit profile:switched"]
    C["CreateProfile(name)"] --> CP["持久化, ID = pf_unixnano"] --> CE["emit profile:created"]
```

payload 均为对应 ProfileConfig JSON。

## 配置持久化

| 文件 | 内容 |
| --- | --- |
| `~/.luckydraw/config.json` | `{Cookie}` |
| `~/.luckydraw/state.json` | `{Profiles, ActiveProfile}` |

关键词与中奖数变更后 500ms 防抖自动调用 `SaveProfileConfig` 写入 `state.json`。
