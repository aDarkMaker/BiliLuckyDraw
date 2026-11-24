# Build & Package

## Build

```bash
cd luckydraw
task build
```

`task build` resolves to `task {{OS}}:build` (dispatching to `darwin:build` / `windows:build` / `linux:build`); output lands in `bin/`.

```mermaid
flowchart LR
    A[go mod tidy] --> B[generate frontend bindings]
    B --> C["build frontend tsc && vite build"]
    C --> D[generate platform icons]
    D --> E["go build -tags production"]
```

| Platform | Command | Output |
| --- | --- | --- |
| macOS | `task darwin:build` | `bin/luckydraw` |
| macOS universal | `task darwin:build:universal` | `bin/luckydraw` (arm64 + amd64) |
| Windows | `task windows:build ARCH=amd64` | `bin/luckydraw.exe` |
| Linux | `task linux:build` | `bin/luckydraw` |

## Package

```bash
task package                    # current OS
task darwin:package             # macOS → bin/luckydraw.app
task darwin:package:universal   # macOS universal → bin/luckydraw.app
task windows:package ARCH=amd64 # Windows → bin/luckydraw-amd64-installer.exe
```

- **macOS**: produces `bin/luckydraw.app` (bundle + ad-hoc signature). Not notarized, so the first launch needs manual approval in System Settings.
- **Windows**: `windows:package` builds the `.exe` and then runs NSIS. `makensis` is enough for cross-packaging on macOS (`brew install makensis`).
- **Linux**: `linux:package` produces a binary and a `.desktop` file; CGO builds use Docker off Linux hosts.

::: tip Cross-compilation
- Linux builds need CGO and go through the `wails-cross` Docker image (`wails3 task setup:docker` first).
- Windows builds default to `CGO_ENABLED=0`, so they cross-compile directly on macOS without Docker.
:::

## Local release (no GitHub Actions)

CI billing issues mean releases are produced locally:

```bash
cd luckydraw

# 1. frontend output + backend build (bindings and icons included)
# windows:package already depends on windows:build
task darwin:package:universal
task windows:package ARCH=amd64

# 2. collect release artifacts
mkdir -p bin/dist
ditto -c -k --sequesterRsrc --keepParent bin/luckydraw.app bin/dist/BiliLuckyDraw-darwin-universal.zip
cp bin/luckydraw-amd64-installer.exe bin/dist/
cp bin/luckydraw.exe bin/dist/luckydraw-amd64-portable.exe

# 3. checksums (list files explicitly; do not use *, or SHA256SUMS.txt hashes itself)
cd bin/dist
shasum -a 256 \
  BiliLuckyDraw-darwin-universal.zip \
  luckydraw-amd64-installer.exe \
  luckydraw-amd64-portable.exe \
  > SHA256SUMS.txt
```

| Artifact | Description |
| --- | --- |
| `BiliLuckyDraw-darwin-universal.zip` | macOS `.app`, arm64 + amd64 |
| `luckydraw-amd64-installer.exe` | Windows x64 installer (NSIS) |
| `luckydraw-amd64-portable.exe` | Windows x64 portable build |
| `SHA256SUMS.txt` | checksums for the files above |

## Versioning and release

Windows version metadata lives in three places that must be edited by hand (the Wails CLI does not expand `{{.Info.*}}` placeholders here):

| File | Field |
| --- | --- |
| `build/config.yml` | `info.version` |
| `build/windows/info.json` | `fixed.file_version` and every literal under `info.0000` |
| `build/windows/installer/wails_tools.nsh` | `INFO_PRODUCTVERSION` |

`build/windows/wails.exe.manifest` also hardcodes the version inside `assemblyIdentity`; update it in the same pass.

```bash
# 1. bump the version (files listed above)
vim build/config.yml build/windows/info.json build/windows/installer/wails_tools.nsh

# 2. sync the docs
#    the version table in docs/development/build.md and docs/en/development/build.md
#    add a section to docs/development/changelog.md and docs/en/development/changelog.md

# 3. repackage; delete the stale syso first or task sees no reason to rebuild
rm -f wails_windows_amd64.syso
task windows:package ARCH=amd64

# 4. commit and tag (pushing tags triggers the GitHub Actions Windows build)
git add -A
git commit -m "release: v1.7.0"
git tag -a v1.7.0 -m "v1.7.0"
git push origin main --tags
```

For local-only releases, skip `git tag` / `git push --tags` and upload the artifacts in `bin/dist/` directly.

## Frontend-only build

From `frontend/`:

```bash
npm run dev     # Vite dev server on 9245, proxies /api to 9246
npm run build   # tsc && vite build into dist/
```

`vite.config.ts` proxies `/api` and `/wails` to `127.0.0.1:9246`, so browser-only development needs `go run ./cmd/devbridge` running alongside.

## Build config

`build/config.yml` defines packaging metadata:

| Field | Value |
| --- | --- |
| companyName | aDarkMaker |
| productName | BiliLuckyDraw |
| productIdentifier | com.adarkmaker.bililuckydraw |
| version | 1.7.0 |
| copyright | (c) 2025, aDarkMaker |

The `dev_mode` section configures hot reload: ignores `node_modules` / `frontend` / `bin`, watches `*.go` / `*.js` / `*.ts`, debounce 1000ms. When bumping the version, update `build/config.yml` and the version table here.
