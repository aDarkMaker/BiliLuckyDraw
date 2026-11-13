# 前端绑定

## 绑定是什么

Wails v3 扫描后端导出方法，把 TypeScript 绑定生成到 `frontend/bindings/luckydraw/internal/app/`。前端以 `AppService` 命名空间导入，每个方法内部通过 `Call.ByID(numericID, ...)` 走 Wails IPC。

绑定目录已 `.gitignore`，**勿手改**——每次构建都按后端方法重新生成。

## 生成

```bash
cd luckydraw
task common:generate:bindings
```

实际执行 `wails3 generate bindings -ts -f '<build flags>' -clean=true ./...`。`task build` 与 `task dev` 都会自动先跑这一步。

## 什么时候要手动重生成

- 改动 `internal/app/` 里导出方法的**签名**、新增或删除方法之后
- 拉取他人改动之后（绑定不入库）
- 前端报 `Cannot find module '../../../bindings/luckydraw/internal/app'`
- 后端方法改了但前端调用报 `method not found`

::: warning
改了后端方法却没重生成绑定，前端会静默拿到 undefined 或签名不匹配。改完务必跑一次 `task common:generate:bindings`。
:::

## 返回值约定

为让「Wails 绑定」与「HTTP 桥接」共用同一份前端封装，返回结构化数据的方法统一返回 JSON 字符串：

```ts
// features/rooms/api.ts
info: async (roomID: number): Promise<RoomInfo> =>
	fallback(
		async () => parseJSON<RoomInfo>(await AppService.GetRoomInfo(roomID), emptyRoom(roomID)),
		async () => callHTTP<RoomInfo>(`/api/rooms/info?id=${roomID}`)
	),
```

`parseJSON(raw, fallback)` 在解析失败时返回兜底值，空字符串也不会抛错。新增返回复杂结构的方法时保持这个约定，否则 HTTP 分支无法复用同一段逻辑。

## 与 HTTP 桥接的关系

`services/http.ts` 的 `fallback(remote, http)` 决定走哪条通道：

- `remote` = 上面生成的绑定
- `http` = `/api/*`，由 `devbridge.Transport.APIHandler()` 提供

新增后端方法时，如果需要浏览器调试可用，除了 `internal/app` 的薄委托，还要在 `internal/devbridge/api.go` 补一条路由，并把方法加进 `devbridge.API` 接口。
