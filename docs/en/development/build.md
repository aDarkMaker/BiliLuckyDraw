# Build & Package

## Build

```bash
task build
```

`task build` resolves to `task {{OS}}:build` (auto-dispatches to `darwin:build` / `windows:build` / `linux:build`). Output lands in `bin/luckydraw` (`.exe` on Windows).

```mermaid
flowchart LR
    A[go mod tidy] --> B[generate bindings]
    B --> C["build frontend tsc && vite build"]
    C --> D[generate icons]
    D --> E["go build -tags production"]

classDef step fill:var(--vp-c-brand-soft),stroke:var(--vp-c-brand-1),color:var(--vp-c-text-1);
class A,B,C,D,E step;
```

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

::: code-group

```bash [bun]
bun run dev     # vite, dev preview (in real dev, use task dev for the integrated flow)
bun run build   # tsc && vite build, production build into dist/
```

```bash [npm]
npm run dev
npm run build
```

```bash [pnpm]
pnpm dev
pnpm build
```

```bash [yarn]
yarn dev
yarn build
```

:::

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
