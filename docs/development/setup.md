# 环境准备

## 前置要求

- **Go** 1.25+
- **Bun**（或 npm / pnpm / yarn）
- **Wails v3 CLI**：`go install github.com/wailsapp/wails/v3/cmd/wails3@latest`
- **Task**：`go install github.com/go-task/task/v3/cmd/task@latest`

## 克隆与安装依赖

```bash
git clone https://github.com/aDarkMaker/BiliLuckyDraw.git
cd BiliLuckyDraw/luckydraw
```

安装前端依赖（在 `frontend/` 下执行）：

::: code-group

```bash [bun]
bun install
```

```bash [npm]
npm install
```

```bash [pnpm]
pnpm install
```

```bash [yarn]
yarn install
```

:::

## 开发模式

```bash
task dev
```

实际执行 `wails3 dev -config ./build/config.yml -port 9245`，支持热重载（前端 Vite + 后端 Go）。

::: tip
所有 `task` 命令均在 `luckydraw/` 目录（含根 `Taskfile.yml`）下执行。
:::
