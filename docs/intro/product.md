# BiliLuckyDraw

BiliLuckyDraw 是一个为 B 站直播间设计的弹幕抽奖桌面应用。开启后会实时监听直播间的弹幕：观众发送包含指定关键词的弹幕就视为参与抽奖，开奖时从所有参与者中随机抽取中奖者。整个过程自动完成，无需人工记录名单，公平透明。

它适合主播在直播中快速举办互动抽奖——无论是日常宠粉、粉丝节活动还是节日庆典，都能即开即用。

- 仓库：[aDarkMaker/BiliLuckyDraw](https://github.com/aDarkMaker/BiliLuckyDraw)
- 下载：[Releases](https://github.com/aDarkMaker/BiliLuckyDraw/releases)
- 许可证：[MIT](https://github.com/aDarkMaker/BiliLuckyDraw/blob/main/LICENSE) © 2025 aDarkMaker

## 它能做什么

- 实时监控一个或多个直播间的弹幕
- 观众发送含关键词的弹幕即视为参与，按 UID 去重（同一直播间多次发言只计一次）
- 一键开奖，随机抽取指定数量的中奖者
- 支持粘贴 Cookie 与手机扫码两种登录方式
- 多套抽奖配置随时切换，设置自动记住
- 日间 / 夜间 / 春节 / 海滩四套主题，运行时可切换

## 截图预览

| 首页 / 抽奖页 | 登录页 | 扫码登录 |
| --- | --- | --- |
| ![首页](/img/home.png) | ![登录页](/img/login.png) | ![扫码登录](/img/prcode.png) |

| 设置页 | 中奖结果 | 抽奖历史 |
| --- | --- | --- |
| ![设置页](/img/settings.png) | ![中奖结果](/img/winners.png) | ![抽奖历史](/img/history.png) |

## 技术栈

| 层 | 技术 |
| --- | --- |
| 后端 | Wails v3 (v3.0.0-alpha.95) · Go 1.25 |
| 前端 | React 18 · TypeScript 5 · Vite · Bun |
| 通信 | WebSocket · Gorilla |
