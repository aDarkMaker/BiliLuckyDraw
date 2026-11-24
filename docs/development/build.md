# 构建与打包

## 构建

```bash
cd luckydraw
task build
```

`task build` 等价于 `task {{OS}}:build`（自动分发到 `darwin:build` / `windows:build` / `linux:build`），产物落在 `bin/`。

```mermaid
flowchart LR
    A[go mod tidy] --> B[生成前端绑定]
    B --> C["构建前端 tsc && vite build"]
    C --> D[生成平台图标]
    D --> E["go build -tags production"]
```

各平台构建命令与产物：

| 平台 | 命令 | 产物 |
| --- | --- | --- |
| macOS | `task darwin:build` | `bin/luckydraw` |
| macOS 通用 | `task darwin:build:universal` | `bin/luckydraw`（arm64 + amd64） |
| Windows | `task windows:build ARCH=amd64` | `bin/luckydraw.exe` |
| Linux | `task linux:build` | `bin/luckydraw` |

## 打包

```bash
task package                  # 当前系统
task darwin:package           # macOS → bin/luckydraw.app
task darwin:package:universal # macOS 通用 → bin/luckydraw.app
task windows:package ARCH=amd64 # Windows → bin/luckydraw-amd64-installer.exe
```

- **macOS**：产出 `bin/luckydraw.app`（bundle + ad-hoc 签名）。未做公证，首次打开需在系统设置里放行。
- **Windows**：`windows:package` 先构建 `.exe`，再用 NSIS 生成安装包；需要 `makensis`（macOS 上 `brew install makensis` 即可交叉打包）。
- **Linux**：`linux:package` 产出二进制与 `.desktop` 文件，CGO 构建在非 Linux 主机上走 Docker。

::: tip 跨平台编译
- Linux 构建依赖 CGO，非 Linux 主机通过 `wails-cross` Docker 镜像（先执行 `wails3 task setup:docker`）。
- Windows 构建默认 `CGO_ENABLED=0`，可以直接在 macOS 上交叉编译，无需 Docker。
:::

## 本地发布（不依赖 GitHub Actions）

由于 CI 计费问题，发布改为本地手动完成：

```bash
cd luckydraw

# 1. 前端产物 + 后端编译（含绑定与图标）
# windows:package 会依赖 windows:build，不必先单独 build
task darwin:package:universal
task windows:package ARCH=amd64

# 2. 收集发布产物
mkdir -p bin/dist
ditto -c -k --sequesterRsrc --keepParent bin/luckydraw.app bin/dist/BiliLuckyDraw-darwin-universal.zip
cp bin/luckydraw-amd64-installer.exe bin/dist/
cp bin/luckydraw.exe bin/dist/luckydraw-amd64-portable.exe

# 3. 生成校验和（必须显式列文件，勿用 *，否则会把 SHA256SUMS.txt 自身算进去）
cd bin/dist
shasum -a 256 \
  BiliLuckyDraw-darwin-universal.zip \
  luckydraw-amd64-installer.exe \
  luckydraw-amd64-portable.exe \
  > SHA256SUMS.txt
```

产物清单：

| 文件 | 说明 |
| --- | --- |
| `BiliLuckyDraw-darwin-universal.zip` | macOS `.app`，arm64 + amd64 |
| `luckydraw-amd64-installer.exe` | Windows x64 安装包（NSIS） |
| `luckydraw-amd64-portable.exe` | Windows x64 绿色版 |
| `SHA256SUMS.txt` | 上述文件的校验和 |

## 版本与发布

Windows 版本信息来自三个需要手工同步的地方（Wails CLI 不会替换 `{{.Info.*}}` 占位符）：

| 文件 | 字段 |
| --- | --- |
| `build/config.yml` | `info.version` |
| `build/windows/info.json` | `fixed.file_version` 与 `info.0000.*` 全部字面值 |
| `build/windows/installer/wails_tools.nsh` | `INFO_PRODUCTVERSION` |

`build/windows/wails.exe.manifest` 的 `assemblyIdentity` 也写着版本号，改版本时一并更新。

```bash
# 1. 改版本号（上面列的文件）
vim build/config.yml build/windows/info.json build/windows/installer/wails_tools.nsh

# 2. 同步文档
#    docs/development/build.md 与 docs/en/development/build.md 的 version 表
#    docs/development/changelog.md 与 docs/en/development/changelog.md 增加一节

# 3. 重新打包：先删掉旧的 syso，否则 task 认为无需重建
rm -f wails_windows_amd64.syso
task windows:package ARCH=amd64

# 4. 提交与打标签（push 后触发 GitHub Actions 的 Windows 构建）
git add -A
git commit -m "release: v1.7.0"
git tag -a v1.7.0 -m "v1.7.0"
git push origin main --tags
```

如果只用本地打包、不走 Actions，跳过 `git tag` / `git push --tags`，直接上传 `bin/dist/` 下的产物即可。

## 前端单独构建

在 `frontend/` 目录下：

```bash
npm run dev     # Vite 开发服务器（端口 9245，代理 /api 到 9246）
npm run build   # tsc && vite build，输出到 dist/
```

`vite.config.ts` 把 `/api` 与 `/wails` 代理到 `127.0.0.1:9246`，因此纯浏览器开发需要同时运行 `go run ./cmd/devbridge`。

## 构建配置

`build/config.yml` 定义打包元信息：

| 字段 | 值 |
| --- | --- |
| companyName | aDarkMaker |
| productName | BiliLuckyDraw |
| productIdentifier | com.adarkmaker.bililuckydraw |
| version | 1.7.0 |
| copyright | (c) 2025, aDarkMaker |

`dev_mode` 段定义热重载行为：忽略 `node_modules` / `frontend` / `bin` 等目录，监听 `*.go` / `*.js` / `*.ts`，debounce 1000ms。版本号改动需同步 `build/config.yml` 与文档中的版本表。
