# Frontend Bindings

## What bindings are

Wails v3 scans exported backend methods and generates TypeScript bindings into `frontend/bindings/luckydraw/internal/app/`. The frontend imports them as the `AppService` namespace; each method calls `Call.ByID(numericID, ...)` over Wails IPC.

The directory is gitignored and **must not be hand-edited** — it is regenerated from backend methods on every build.

## Generate

```bash
cd luckydraw
task common:generate:bindings
```

Runs `wails3 generate bindings -ts -f '<build flags>' -clean=true ./...`. Both `task build` and `task dev` run it first.

## When to regenerate manually

- After changing an **exported method's signature** in `internal/app/`, or adding/removing one
- After pulling changes (bindings are not committed)
- When the frontend reports `Cannot find module '../../../bindings/luckydraw/internal/app'`
- When a changed backend method makes the frontend throw `method not found`

::: warning
Changing a backend method without regenerating leaves the frontend with `undefined` or a signature mismatch. Always run `task common:generate:bindings` afterwards.
:::

## Return-value convention

So that the Wails bindings and the HTTP bridge share one frontend API layer, methods returning structured data return JSON strings:

```ts
// features/rooms/api.ts
info: async (roomID: number): Promise<RoomInfo> =>
	fallback(
		async () => parseJSON<RoomInfo>(await AppService.GetRoomInfo(roomID), emptyRoom(roomID)),
		async () => callHTTP<RoomInfo>(`/api/rooms/info?id=${roomID}`)
	),
```

`parseJSON(raw, fallback)` returns the fallback on parse failure, and an empty string is safe. Keep this convention for new methods with structured returns, otherwise the HTTP branch cannot reuse the same code.

## Relation to the HTTP bridge

`fallback(remote, http)` in `services/http.ts` picks the transport:

- `remote` = the generated binding
- `http` = `/api/*`, served by `devbridge.Transport.APIHandler()`

When adding a backend method that should also work in a browser tab, besides the thin `internal/app` delegation, add a route in `internal/devbridge/api.go` and extend the `devbridge.API` interface.
