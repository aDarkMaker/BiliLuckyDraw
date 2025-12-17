# BiliLuckyDraw

一个用于 **B 站直播间弹幕抽奖** 的桌面应用（Wails + Vue）。

## 运行

前置：Go / Node.js / Wails v2。

```bash
wails dev
```

## 打包

```bash
wails build
```

## 使用说明

- **输入房间号** → 启动弹幕
- **设置关键词** → 开始收集（仅收集“内容=关键词”的弹幕用户）
- **抽取 N 人** → 输出中奖用户列表

## 常见问题

- **连不上/拿不到 token**：尝试清空 Cookie（或只填 `SESSDATA`），再重试。
