# Frontend Bindings

## What bindings are

Wails v3 scans the backend service's exported methods and auto-generates TypeScript bindings into `frontend/bindings/luckydraw/internal/app/`. The frontend imports them as the `AppService` namespace; each method internally calls `Call.ByID(numericID, ...)`.

The bindings directory is `.gitignore`d and **must not be hand-edited** — it is regenerated from the backend methods on every build.

## Regenerate

```bash
task common:generate:bindings
```

Runs `wails3 generate bindings -ts -clean=true ./...` (with `-f` passing through build flags). Both `task build` and `task dev` trigger this task automatically.

## When to regenerate manually

- After changing the **signature** of, or **adding/removing**, an exported method in `internal/app/`
- After pulling others' changes (bindings aren't checked in, so rebuild locally)
- When the frontend import errors with `Cannot find module 'bindings/...'`

::: warning
Changing a backend method without regenerating bindings causes `method not found` or signature-mismatch errors on the frontend. Always run `task common:generate:bindings` after changing methods.
:::
