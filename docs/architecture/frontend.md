# 前端架构

## 双通道桥接

前端不直接假设运行在 Wails 窗口中。`services/http.ts` 在启动时探测一次 `/api/lottery/status`：

```ts
const fallback = async <T>(remote: () => Promise<T>, http: () => Promise<T>): Promise<T> => {
	if (!bridgeProbed) await probeHTTPBridge();
	if (httpPreferred || !hasWailsRuntime()) {
		httpPreferred = true;
		return http();
	}
	try {
		return await remote();
	} catch (remoteError) {
		try {
			const value = await http();
			httpPreferred = true;
			return value;
		} catch (httpError) {
			throw new Error(describe(remoteError, httpError));
		}
	}
};
```

- **远程分支**（`remote`）= 生成的 Wails 绑定，`AppService.*`。
- **HTTP 分支**（`http`）= `fetch('/api/...')`，由 Vite 代理到桥接端口。

一旦探测成功就固定走 HTTP，之后不再反复切换。两条分支都失败时，错误信息里会带上「本地后端未运行，请启动开发桥接」的提示。

生成的绑定位于 `frontend/bindings/luckydraw/internal/app/`，由 `wails3 generate bindings` 产出，**不要手改**；复杂返回值是 JSON 字符串，统一用 `parseJSON(raw, fallback)` 解析。

## 页面与路由

```
main.tsx            Provider → BrowserRouter → App
App.tsx             未登录 → LoginPage；已登录 → DefaultLayout + Routes
layouts/default.tsx  侧栏 + 顶栏 + 可滚动内容区（滚动条静置淡出）
features/session/login_page.tsx
features/lottery/lottery_page.tsx
features/settings/settings_page.tsx
```

路由：`/` 选人页，`/settings` 设置页，其余重定向到 `/`。

## 状态：AppContext

`contexts/app.tsx` 把三个 hook 合并成一个 context：

| Hook | 负责 |
| --- | --- |
| `useSession` | 登录态、账号信息、登入 / 登出 |
| `useProfiles` | Profile 列表、当前配置、频道、背景、口令与人数（400ms 防抖自动保存） |
| `useLottery` | 运行态、参与人数（2s 轮询）、开奖结果、开始 / 停止 / 重置 |

组件通过 `useApp()` 取用；`notify` 与 `logout` 也挂在同一个对象上。配置背景变化时，`AppProvider` 同步给 `useTheme().setCustomImage`。

## 功能域

| 目录 | 内容 |
| --- | --- |
| `features/session/` | `login_page`、`useQRLogin`（二维码状态机）、`useTilt`（卡片倾斜）、`login_backdrop` |
| `features/lottery/` | `lottery_page`、`control_bar`（口令 + 人数步进）、`action_panel`、`winners_panel`、`account_card`、`stat`、`useLottery` |
| `features/rooms/` | `room_stage`（HLS 播放器 + 看门狗）、`room_list`、`danmaku_panel`、`useDanmakuFeed`、`useRoomInfo`、`hls`、`emote` |
| `features/profiles/` | `useProfiles`、`api` |
| `features/settings/` | `settings_page` + `account` / `appearance` / `profiles` / `rooms` / `history` 五个 section |
| `features/history/` | `useHistory`、`history_record` |

## 通用组件

| 组件 | 职责 |
| --- | --- |
| `Panel` / `PanelHeader` / `PanelBody` | 统一的卡片容器（`PanelBody` 用 `forwardRef` 支持滚动引用） |
| `Icon` | 读 `generated/icons.ts` 的路径表渲染单色 SVG，颜色走 `currentColor` |
| `CachedImage` | 懒加载 + CDN 缩略图 + 预解码，见下节 |
| `useQuietScroll` | 滚动时给容器加 `data-scrolling="true"`，700ms 后移除，配合 `.scroll-quiet` 隐藏滚动条 |
| `Toaster` | `react-hot-toast` 的胶囊样式封装 |
| `Backdrop` | 背景图 + 色调匹配的遮罩，或默认渐变光斑 |
| `ui.tsx` / `field.ts` | `PrimaryButton` / `GhostButton` / `IconButton` / `Row` / `Pill` 与输入框 classNames |

## 图片链路

弹幕刷屏时最容易卡主线程的是图片解码，因此分三层处理：

1. **CDN 缩略图**：`imageThumb(src, px)` 把 B 站图片改写成 `@<2×px>w_<2×px>h_1c.webp`，头像这类小图不再拉原图。
2. **限并发预解码**：`image_queue.ts` 用 `new Image()` + `img.decode()` 在空闲期解码，同时最多 4 个，避免一次性解码几十张图。
3. **可见区挂载**：`CachedImage` 用 `IntersectionObserver` 监听最近的滚动容器（`scrollRoot` 向上找 `overflow-y: auto|scroll`），未进入视口的行不发起请求。弹幕新批次只预热最新 6 个头像，更早的行等滚动到再加载。

## 播放器与弹幕

`room_stage.tsx` 负责 HLS 播放：

- hls.js 用 `<script>` 按需加载并缓存 Promise，空闲时预热。
- 错误分致命 / 非致命处理，致命错误最多重建 3 次，退避 1.5s → 20s。
- **时钟看门狗**：每 1.5s 比对 `currentTime`，连续 5s 不前进先尝试 `play()` 软恢复，仍不前进则丢弃实例、重新取播放地址重建。这是为了对付不触发 `error` / `stalled` 事件的静默卡流。
- 切房间或组件卸载时务必销毁实例并清掉定时器。

`danmaku_panel.tsx` 负责滚动行为：

- 默认 `stick = true`，新行到来时在 `requestAnimationFrame` 里贴底。
- 用户上滚（离底超过 48px）后 `stick = false`，并启动 3s 空闲计时。
- 空闲到期自动恢复贴底；`writing` 标记避免程序滚动触发自身的 `onScroll` 逻辑。
- 弹幕来自 `useDanmakuFeed`：700ms 轮询 + 200ms 合批，最多保留 120 行。

## 主题与主色

`theme/index.tsx` 管两件事：深浅模式与背景预设。

- 模式存 `localStorage 'luckydraw.mode'`，首次按 `prefers-color-scheme` 决定，切换时改 `documentElement.classList` 的 `dark` / `light`。
- 背景预设存 `'luckydraw.preset'`，取值 `none` / `spring-festival` / `beach`；自定义图片优先级最高。`background = customImage || presetImage(preset)`。
- `accent.ts` 把背景图缩到 48×48 画进 canvas，按饱和度与亮度加权求主色，生成整套 `--heroui-primary-50…900`。没有背景图时用预设色（默认 344 度，春节 2 度，假日 218 度）。

## i18n

自建轻量实现，没有 react-i18next：`Lang = 'zh' | 'en'`，默认中文，存 `localStorage 'luckydraw-lang'`。`t(key, params)` 支持 `{{param}}` 插值，回退 zh → key。字典是 `i18n/zh.json` 与 `i18n/en.json`，两个文件必须保持同一组 key。

## 样式约定

- Tailwind + HeroUI，颜色一律走 CSS 变量（`--heroui-*`、`--surface`、`--well`、`--backdrop-tint`），不在组件里写死色值。
- `styles/globals.css` 放字体、基础层与滚动条；`theme.css` 放主题相关变量；`inputs.css` 放输入框细节。
- 布局以 `flex` + `min-h-0` 控制面板高度，避免子元素撑破容器导致整页滚动。
