<div align="center">
  <img src="../../img/logo.png" width="160" alt="BiliLuckyDraw logo" />

  # BiliLuckyDraw

  基于 Wails v3 + Go + React + TypeScript 的 B 站直播间弹幕抽奖桌面应用

  ![Wails](https://img.shields.io/badge/Wails-v3-red?style=for-the-badge)
  ![Go](https://img.shields.io/badge/Go-1.25+-00ADD8?style=for-the-badge&logo=go&logoColor=white)
  ![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=white)
  ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
  ![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

  [English](./README.en-US.md) · **简体中文**
</div>

---

## 简介

BiliLuckyDraw 是一个 B 站直播弹幕抽奖桌面应用。开启后实时监控直播间弹幕，按关键词收集参与用户，随机抽取中奖者。支持多 Profile（抽奖配置集）、扫码 / Cookie 登录、日间 / 夜间 / 春节 / 海滩四套主题。

## 功能特性

- **直播间抽奖**：实时监控弹幕，按关键词收集参与用户，随机抽奖
- **多种登录方式**：Cookie 登录、B 站 APP 扫码登录
- **多 Profile**：多套抽奖配置（关键词 / 中奖数 / 监控房间），一键切换
- **主题系统**：日间（默认，跟随系统）、夜间、春节、海滩四套主题，运行时可切换，选择持久化
- **可定制**：自定义关键词、监控房间、背景图

## 截图预览

<div align="center">
  <table>
    <tr>
      <td align="center"><img src="../../img/home.png" width="360" alt="首页/抽奖页"/><br/><sub>首页 / 抽奖页</sub></td>
      <td align="center"><img src="../../img/login.png" width="360" alt="登录页"/><br/><sub>登录页</sub></td>
      <td align="center"><img src="../../img/prcode.png" width="360" alt="扫码登录"/><br/><sub>扫码登录</sub></td>
    </tr>
    <tr>
      <td align="center"><img src="../../img/settings.png" width="360" alt="设置页"/><br/><sub>设置页</sub></td>
      <td align="center"><img src="../../img/winners.png" width="360" alt="中奖结果"/><br/><sub>中奖结果</sub></td>
    </tr>
  </table>
</div>

## 快速开始

1. **下载安装包**：从 [Releases](https://github.com/aDarkMaker/BiliLuckyDraw/releases) 下载对应平台的安装文件
2. **登录**：支持 Cookie 登录和二维码扫码登录
3. **配置直播间**：在设置页添加要监控的直播间
4. **开启抽奖**：点击开始，程序实时监控弹幕并收集参与用户

## 下载方式

- **[GitHub Releases](https://github.com/aDarkMaker/BiliLuckyDraw/releases)**

## 技术栈

| 层 | 技术 |
| --- | --- |
| 后端 | Wails v3 · Go 1.25 |
| 前端 | React 18 · TypeScript 5 · Vite · Bun |
| 通信 | WebSocket · Gorilla |

## 目录结构

```
luckydraw/
  main.go                        # Wails v3 入口（embed 前端 dist）
  Taskfile.yml                   # 构建工作流（dev/build/package/generate）
  build/                         # 各平台构建配置与 Taskfile
  internal/
    app/                         # 薄 Wails 服务层（唯一 import wails/v3），委托 service
    service/                     # 纯业务逻辑（auth/live/profile），不依赖 Wails
    domain/                      # 接口 + DTO
    event/                       # Emitter 接口（service 与 Wails 解耦）
    config/ bili/ live/ login/   # 配置、B 站 API、直播弹幕协议、扫码登录
  frontend/
    src/
      themes/                    # 主题系统：light / dark / spring-festival / beach
      styles/ components/ hooks/ # 基础结构 token、组件样式、React Hooks
    bindings/                    # wails3 generate bindings 生成（勿手改）
```

## 开发与构建

### 环境要求

- Go 1.25+
- Bun（或 npm / pnpm / yarn）
- Wails v3 CLI：`go install github.com/wailsapp/wails/v3/cmd/wails3@latest`
- Task：`go install github.com/go-task/task/v3/cmd/task@latest`

### 本地开发

```bash
git clone https://github.com/aDarkMaker/BiliLuckyDraw.git
cd BiliLuckyDraw/luckydraw
task common:install:frontend:deps   # 安装前端依赖（bun）
task dev                            # 开发模式（热重载）
```

### 构建与打包

```bash
task build                       # 构建当前平台可执行文件
task darwin:package              # 打包 macOS 应用
task windows:package             # 打包 Windows 应用
task common:generate:bindings    # 改后端方法后重新生成前端绑定
```

> 详见 `luckydraw/Taskfile.yml` 与 `luckydraw/build/`。

## 开发说明

- 前端绑定位于 `frontend/bindings/`，由 `wails3 generate bindings` 生成，**勿手改**；改后端方法后重新生成
- 主题通过 CSS 变量按 `theme-light` / `theme-dark` / `theme-spring-festival` / `theme-beach` class 作用域切换，颜色全部走 token
- 后端分层：`app`（Wails 边界）→ `service`（纯业务）→ `domain`（接口）/ `event`（事件解耦），`app` 是唯一 import wails/v3 的包

## 许可证

[MIT License](../../LICENSE) © 2025 aDarkMaker
