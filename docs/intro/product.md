# BiliLuckyDraw

BiliLuckyDraw 是一个 B 站直播弹幕抽奖桌面应用。开启后实时监控直播间弹幕，按关键词收集参与用户，随机抽取中奖者。基于 Wails v3 + Go + React + TypeScript 构建，支持多账号配置、扫码 / Cookie 登录、日间 / 夜间 / 春节 / 海滩四套主题。

- 仓库：[aDarkMaker/BiliLuckyDraw](https://github.com/aDarkMaker/BiliLuckyDraw)
- 下载：[Releases](https://github.com/aDarkMaker/BiliLuckyDraw/releases)
- 许可证：[MIT](https://github.com/aDarkMaker/BiliLuckyDraw/blob/main/LICENSE) © 2025 aDarkMaker

## 它能做什么

实时监控直播间弹幕，观众发送包含关键词的弹幕即视为参与；抽奖时从参与者池中随机抽取指定数量的中奖者。参与者按 UID 去重，同一直播间多次发言只计一次。

## 截图预览

| 首页 / 抽奖页 | 登录页 |
| --- | --- |
| ![首页](/img/home.png) | ![登录页](/img/login.png) |

| 扫码登录 | 设置页 |
| --- | --- |
| ![扫码登录](/img/prcode.png) | ![设置页](/img/settings.png) |

| 中奖结果 |
| --- |
| ![中奖结果](/img/winners.png) |

## 技术栈

| 层 | 技术 |
| --- | --- |
| 后端 | Wails v3 (v3.0.0-alpha.95) · Go 1.25 |
| 前端 | React 18 · TypeScript 5 · Vite · Bun |
| 通信 | WebSocket · Gorilla |
