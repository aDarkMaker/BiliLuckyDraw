# 前端架构

## 前后端桥接

Wails 自动生成的 TS 绑定位于 `frontend/bindings/luckydraw/internal/app/`（由 `wails3 generate bindings` 生成，已 gitignore，**勿手改**）。前端以 `AppService` 命名空间导入，每个方法内部调用 `Call.ByID(numericID, ...)`。复杂返回值为 JSON 字符串，前端 `JSON.parse` 解析。

## 事件

```ts
import { Events } from '@wailsio/runtime';
```

`useLottery` 订阅 `Events.On('live:user_join', cb)`，回调内调用 `GetParticipantCount` 实时更新参与人数。另有 1000ms 轮询兜底，检查 `IsLiveLotteryRunning` + `GetParticipantCount`。扫码登录在 QR 界面以 2000ms 轮询 `CheckQRCodeStatus`。

## 组件

| 组件 | 职责 |
| --- | --- |
| `LoginView` | 扫码登录（生成 QR + 轮询状态）与 Cookie 登录 |
| `LotteryView` | 开始/停止抽奖按钮（主题图或 CSS 回退），结束后展示 `WinnerDisplay` |
| `SettingsView` | 账号信息、外观（主题/语言）、Profile 增删改切、背景图、监控房间 |
| `TopBar` | Profile 下拉、关键词输入、中奖数步进器（1–9999）、设置头像按钮 |
| `WinnerDisplay` | 中奖名单（排名 + 用户名 + UID）与重开按钮 |
| `Button` / `Input` / `MessageToast` | 通用控件（Toast 1800ms 显示 + 300ms 淡出） |

## Hooks

- `useAuth`：管理登录态、账号信息、背景图、监控房间、Profile、关键词、中奖数。挂载时若 `IsLoggedIn` 为真则 `loadAll`。关键词/中奖数变更后 500ms 防抖调用 `SaveProfileConfig` 自动保存。
- `useLottery(watchedRooms, keyword, winnerCount)`：管理抽奖运行态、参与人数、中奖者。`handleStartLottery` 切换开始/停止；停止时 `StopLiveLottery` → `DrawWinners` 解析中奖者。

## 主题系统

`themes/index.tsx`：`THEMES = [light, dark, spring-festival, beach]`，每项 `{id, labelKey}`。

- `detectInitialTheme`：读 `localStorage 'luckydraw-theme'`，否则按 `prefers-color-scheme` 选 dark/light。
- 切换时设置 `document.documentElement.className = 'theme-${theme}'` 并持久化。
- `preloadThemeBackground`：挂载时为有背景图的主题（beach / spring-festival）注入 `<link rel="preload" as="image">`，消除切换卡顿。
- `useThemeBackground`：beach / spring-festival 返回主题背景图，light / dark 返回 `null`。背景优先级：主题背景 || 用户自定义背景图。
- 主题 CSS：每主题目录含 `variables.css`（+ 可选 `theme.css` 毛玻璃，beach/spring-festival）；`main.tsx` 引入；light 用全局默认 + `theme-light` class。

## i18n

`i18n/index.tsx`：自建轻量 hook（无 react-i18next）。`Lang = 'zh' | 'en'`，默认 `zh`，持久化 `localStorage 'luckydraw-lang'`。`t(key, params)` 支持 `{{param}}` 插值，回退 zh → key。字典 `zh.json` / `en.json`。

## App.tsx

`View = 'lottery' | 'settings'` 状态机。背景 `= themeBackground || backgroundImage`，作为内联样式 + `has-bg` class。设置页空白处点击关闭（`.app-content` 上 mousedown 不在 `.settings-card` 内 → 切回 lottery）。
