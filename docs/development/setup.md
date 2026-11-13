# 环境准备

## 前置要求

| 工具 | 版本 | 用途 |
| --- | --- | --- |
| Go | 1.25+ | 后端与构建 |
| Node.js | 22+ | 前端构建（默认包管理器为 npm） |
| Wails v3 CLI | `v3.0.0-alpha.95` | 生成绑定、开发与打包 |
| Task | v3 | 执行 `Taskfile.yml` |
| Xcode CLT（仅 macOS） | — | CGO 与 `.app` 打包 |

安装两个命令行工具：

```bash
go install github.com/wailsapp/wails/v3/cmd/wails3@v3.0.0-alpha.95
go install github.com/go-task/task/v3/cmd/task@latest
```

确认版本：

```bash
go version
node -v
wails3 version
task --version
```

::: tip 关于包管理器
`Taskfile.yml` 支持 npm / bun / pnpm / yarn，默认 `PACKAGE_MANAGER=npm`。若本地 bun 安装依赖会挂起，显式传 `PACKAGE_MANAGER=npm` 即可，例如 `task build PACKAGE_MANAGER=npm`。
:::

## 克隆与安装依赖

```bash
git clone https://github.com/aDarkMaker/BiliLuckyDraw.git
cd BiliLuckyDraw/luckydraw
task common:install:frontend:deps
```

依赖装在 `frontend/node_modules/`，不进版本库。

## 开发模式

```bash
task dev
```

等价于 `wails3 dev -config ./build/config.yml -port 9245`，前端 Vite 热更新、后端 Go 改动自动重编译。开发期间：

- Wails 窗口通过 IPC 调用后端。
- 额外在 `127.0.0.1:9246` 起一个 HTTP 桥接，Vite 把 `/api`、`/wails` 代理过去，因此浏览器标签页也能打开 `http://localhost:9245` 调试。

如果只想在浏览器里跑前端（不启 Wails），可以单独启动桥接：

```bash
go run ./cmd/devbridge
```

它复用 `devbridge.Transport.APIHandler()`，提供与桌面端一致的 `/api/*` 路由，并实现系统剪贴板兜底。

## 常用命令

| 命令 | 作用 |
| --- | --- |
| `task dev` | 开发模式（热重载 + 浏览器桥接） |
| `task build` | 构建当前平台可执行文件到 `bin/` |
| `task package` | 打包当前平台（macOS 出 `.app`，Windows 出 NSIS 安装包） |
| `task common:generate:bindings` | 后端方法变更后重新生成前端绑定 |
| `task common:generate:icons` | 由 `build/appicon.png` 生成 `.icns` / `.ico` |
| `go run ./cmd/devbridge` | 只启动浏览器桥接 |

::: tip
所有 `task` 命令都在 `luckydraw/` 目录（含根 `Taskfile.yml`）下执行。
:::

## 本地脚本

`frontend/scripts/` 是本地辅助脚本（已在 `.gitignore` 中，不入库）：

```bash
cd frontend
bun scripts/gen-icons.ts      # 由 src/assets/icons/*.svg 生成 src/generated/icons.ts
bun scripts/check-icons.ts    # 校验命名、重复路径、生成漂移、未引用图标
```

图标规范见 `.cursor/rules/iconify-svg-icons.mdc`：只用 Iconify 导出的单色 SVG，文件名 kebab-case，禁止手改生成文件。
