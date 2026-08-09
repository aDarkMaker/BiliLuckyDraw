# BiliLuckyDraw

基于 Wails v3 + Go 1.25 + React 18 + TypeScript 的 B 站直播间弹幕抽奖桌面应用。

> 项目完整文档（中 / 英）见根目录 [README](../README.md) 与 [`.github/docs/`](../.github/docs/)。本文件为开发者速查。

## 目录结构

```
luckydraw/
  main.go                        # Wails v3 入口（embed 前端 dist）
  Taskfile.yml                   # 构建工作流（dev/build/package/generate）
  build/                         # 各平台构建配置与 Taskfile
  internal/
    app/                         # 薄 Wails 服务层（唯一 import wails/v3），委托 service
      app.go  auth.go  live.go  profile.go
    service/                     # 纯业务逻辑（auth/live/profile），不依赖 Wails
    domain/                      # 接口 + DTO
    event/                       # Emitter 接口（service 与 Wails 解耦）
    config/  bili/  live/  login/  # 配置、B 站 API、直播弹幕协议、扫码登录
  frontend/
    src/
      themes/                    # 主题系统：light / dark / spring-festival
      styles/                    # 基础结构 token + 组件样式
      components/  hooks/
    bindings/                    # wails3 generate bindings 生成（勿手改）
```

## 主题

内置日间（默认，跟随系统 `prefers-color-scheme`）、夜间、春节三套主题，在设置页可运行时切换，选择持久化到 localStorage。颜色全部走 CSS 变量，按 `theme-*` class 作用域切换。

## 开发

```bash
task common:install:frontend:deps   # 安装前端依赖（bun）
task dev                            # 开发模式
task build                          # 构建可执行文件
task common:generate:bindings       # 后端方法变更后重新生成前端绑定
```
