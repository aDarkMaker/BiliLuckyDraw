# Build & Package

## Build

```bash
task build
```

`task build` resolves to `task {{OS}}:build` (auto-dispatches to `darwin:build` / `windows:build` / `linux:build`). Flow: `go mod tidy` → generate bindings → build frontend (`tsc && vite build`) → generate icons → `go build -tags production`. Output lands in `bin/luckydraw` (`.exe` on Windows).

## Package

```bash
task package          # package for the current OS
```

- **macOS**: `darwin:package` produces `bin/luckydraw.app` (`.app` bundle + ad-hoc signed).
- **Windows**: `windows:package` produces `.exe` (CGO off by default → native Go cross-compile; CGO on → Docker).
- **Linux**: `linux:package` produces a binary + `.desktop`.

You can also target a platform explicitly: `task darwin:package` / `task windows:package` / `task linux:package`.

::: tip Cross-compilation
Non-target builds go through the `wails-cross` Docker image (build it first with `wails3 task setup:docker`). On macOS, `task darwin:build:universal` builds an arm64+amd64 universal binary.
:::

## Frontend-only build

From the `frontend/` directory:

```bash
bun run dev     # vite, dev preview (in real dev, use task dev for the integrated flow)
bun run build   # tsc && vite build, production build into dist/
```

## Build config

`build/config.yml` defines packaging metadata:

| Field | Value |
| --- | --- |
| companyName | aDarkMaker |
| productName | BiliLuckyDraw |
| productIdentifier | com.adarkmaker.bililuckydraw |
| version | 1.0.0 |
| copyright | (c) 2025, aDarkMaker |

The `dev_mode` section configures hot reload: ignores `node_modules`/`frontend`/`bin`, watches `*.go`/`*.js`/`*.ts`, debounce 1000ms.
