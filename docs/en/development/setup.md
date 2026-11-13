# Setup

## Prerequisites

| Tool | Version | Purpose |
| --- | --- | --- |
| Go | 1.25+ | backend and build |
| Node.js | 22+ | frontend build (npm is the default package manager) |
| Wails v3 CLI | `v3.0.0-alpha.95` | bindings, dev, packaging |
| Task | v3 | runs `Taskfile.yml` |
| Xcode CLT (macOS only) | — | CGO and `.app` packaging |

Install the two CLIs:

```bash
go install github.com/wailsapp/wails/v3/cmd/wails3@v3.0.0-alpha.95
go install github.com/go-task/task/v3/cmd/task@latest
```

Verify:

```bash
go version
node -v
wails3 version
task --version
```

::: tip Package managers
`Taskfile.yml` supports npm / bun / pnpm / yarn with `PACKAGE_MANAGER=npm` as the default. If a local `bun install` hangs, pass `PACKAGE_MANAGER=npm` explicitly, e.g. `task build PACKAGE_MANAGER=npm`.
:::

## Clone and install dependencies

```bash
git clone https://github.com/aDarkMaker/BiliLuckyDraw.git
cd BiliLuckyDraw/luckydraw
task common:install:frontend:deps
```

Dependencies land in `frontend/node_modules/` and are not committed.

## Development mode

```bash
task dev
```

Equivalent to `wails3 dev -config ./build/config.yml -port 9245`: Vite hot-reloads the frontend and Go changes trigger a rebuild.

- The Wails window talks to the backend over IPC.
- An extra HTTP bridge listens on `127.0.0.1:9246`, and Vite proxies `/api` and `/wails` to it, so you can also open `http://localhost:9245` in a browser.

To run only the frontend in a browser, start the bridge on its own:

```bash
go run ./cmd/devbridge
```

It reuses `devbridge.Transport.APIHandler()`, serving the same `/api/*` routes as the desktop app and implementing the OS clipboard fallback.

## Common commands

| Command | Effect |
| --- | --- |
| `task dev` | dev mode (hot reload + browser bridge) |
| `task build` | build the current platform into `bin/` |
| `task package` | package the current platform (`.app` on macOS, NSIS installer on Windows) |
| `task common:generate:bindings` | regenerate frontend bindings after backend changes |
| `task common:generate:icons` | derive `.icns` / `.ico` from `build/appicon.png` |
| `go run ./cmd/devbridge` | start only the browser bridge |

::: tip
All `task` commands run from `luckydraw/` (where the root `Taskfile.yml` lives).
:::

## Local scripts

`frontend/scripts/` holds local helpers (gitignored, not committed):

```bash
cd frontend
bun scripts/gen-icons.ts      # build src/generated/icons.ts from src/assets/icons/*.svg
bun scripts/check-icons.ts    # check naming, duplicate paths, generated drift, unused icons
```

Icon rules live in `.cursor/rules/iconify-svg-icons.mdc`: single-color SVGs exported from Iconify, kebab-case file names, and never edit the generated file by hand.
