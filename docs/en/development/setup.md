# Setup

## Prerequisites

- **Go** 1.25+
- **Bun** (or npm / pnpm / yarn)
- **Wails v3 CLI**: `go install github.com/wailsapp/wails/v3/cmd/wails3@latest`
- **Task**: `go install github.com/go-task/task/v3/cmd/task@latest`

## Clone & install dependencies

```bash
git clone https://github.com/aDarkMaker/BiliLuckyDraw.git
cd BiliLuckyDraw/luckydraw
```

Install frontend dependencies (under `frontend/`):

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

## Development mode

```bash
task dev
```

Runs `wails3 dev -config ./build/config.yml -port 9245` with hot reload (frontend Vite + backend Go).

::: tip
All `task` commands run from the `luckydraw/` directory (where the root `Taskfile.yml` lives).
:::
