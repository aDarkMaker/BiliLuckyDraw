# BiliLuckyDraw

基于 Wails v3 + Go 1.25 + React 19 + TypeScript 5 的 B 站直播间弹幕抽奖桌面应用。

> 项目完整文档（中 / 英）见根目录 [`.github/docs/`](../.github/docs/) 与 [在线文档](https://adarkmaker.github.io/BiliLuckyDraw/)。本文件为开发者速查。

## 目录结构

```
luckydraw/
  main.go                        # Wails v3 入口（embed 前端 dist）
  Taskfile.yml                   # 构建工作流（dev/build/package/generate）
  build/                         # 各平台构建配置、Taskfile 与图标
  cmd/devbridge/                 # 独立浏览器桥接，复用 internal/devbridge 的 /api 路由
  internal/
    app/                         # 薄 Wails 服务层（唯一 import wails/v3），委托 service
      app.go auth.go live.go danmaku.go room.go profile.go history.go
    service/                     # 纯业务逻辑，不依赖 Wails
      auth.go live.go profile.go room.go danmaku_feed.go emote.go history.go
    live/                        # 弹幕协议 + 抽奖聚合，同包按职责拆文件
      types.go protocol.go room_auth.go parse.go client.go lottery.go
    bili/                        # B 站 HTTP API + WBI 签名
    login/                       # 扫码登录
    config/                      # 配置读写与旧版本迁移
    event/                       # Emitter 接口（service 与 Wails 解耦）
    devbridge/                   # 浏览器 HTTP 传输与 JSON API 路由
  frontend/
    src/
      features/                  # session / lottery / rooms / profiles / settings / history
      components/                # Panel / Icon / CachedImage / 滚动钩子 / Toaster / Backdrop
      theme/                     # 深浅色、背景预设、主色提取
      services/                  # HTTP fallback、桥接探测、二维码、剪贴板
      types/ config/ contexts/ layouts/ i18n/
    scripts/                     # 图标生成与校验（本地脚本，已 gitignore）
    bindings/                    # wails3 generate bindings 生成（勿手改）
```

## 两条通道

前端通过 `services/http.ts` 的 `fallback(remote, http)` 决定走哪条：

1. **Wails IPC**：桌面窗口内，`AppService.*`（生成绑定）。
2. **HTTP `/api/*`**：浏览器调试或绑定失败时，打到 `127.0.0.1:9246`，由 `devbridge.Transport.APIHandler()` 提供。

两条通道共用同一份业务代码与前端 API 封装。

## 主题

深浅色可手动切换（首次跟随系统 `prefers-color-scheme`），背景可选「默认渐变 / 春节 / 假日 / 自定义图片」。主色调由 `theme/accent.ts` 从背景图采样生成整套 `--heroui-primary-*`，没有背景图时用预设色。

## 开发

```bash
cd luckydraw
task common:install:frontend:deps   # 安装前端依赖（默认 npm）
task dev                            # 开发模式（热重载 + 浏览器桥接）
task build                          # 构建当前平台可执行文件
task package                        # 打包当前平台
task common:generate:bindings       # 后端方法变更后重新生成前端绑定
go run ./cmd/devbridge              # 只启动浏览器桥接（不启 Wails）
```

## 前端脚本

```bash
cd frontend
bun scripts/gen-icons.ts      # 由 src/assets/icons/*.svg 生成 src/generated/icons.ts
bun scripts/check-icons.ts    # 校验命名、重复路径、生成漂移、未引用图标
```
