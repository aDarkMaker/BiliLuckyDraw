# 构建与打包

## 构建

```bash
task build
```

`task build` 等价于 `task {{OS}}:build`（自动按当前系统分发到 `darwin:build` / `windows:build` / `linux:build`），产物在 `bin/luckydraw`（Windows 为 `.exe`）。

```mermaid
flowchart LR
    A[go mod tidy] --> B[生成绑定]
    B --> C["构建前端 tsc && vite build"]
    C --> D[生成图标]
    D --> E["go build -tags production"]
```

## 打包

```bash
task package          # 当前系统打包
```

- **macOS**：`darwin:package` 产出 `bin/luckydraw.app`（`.app` bundle + ad-hoc 签名）。
- **Windows**：`windows:package` 产出 `.exe`（CGO 默认关闭，走原生 Go 交叉编译；开启 CGO 走 Docker）。
- **Linux**：`linux:package` 产出二进制 + `.desktop`。

也可显式指定平台：`task darwin:package` / `task windows:package` / `task linux:package`。

::: tip 跨平台编译
- 非目标平台构建通过 Docker 镜像 `wails-cross`（需先 `wails3 task setup:docker` 构建）
- macOS 可 `task darwin:build:universal` 生成 arm64+amd64 通用二进制
:::

## 前端单独构建

在 `frontend/` 目录下：

::: code-group

```bash [bun]
bun run dev     # vite，开发预览（实际开发用 task dev 一体化）
bun run build   # tsc && vite build，生产构建到 dist/
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

## 构建配置

`build/config.yml` 定义打包元信息：

| 字段 | 值 |
| --- | --- |
| companyName | aDarkMaker |
| productName | BiliLuckyDraw |
| productIdentifier | com.adarkmaker.bililuckydraw |
| version | 1.2.0 |
| copyright | (c) 2025, aDarkMaker |

`dev_mode` 段定义热重载行为：忽略 `node_modules`/`frontend`/`bin` 等目录，监听 `*.go`/`*.js`/`*.ts`，debounce 1000ms。
