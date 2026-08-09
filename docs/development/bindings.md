# 前端绑定

## 绑定是什么

Wails v3 扫描后端服务的导出方法，自动生成 TypeScript 绑定到 `frontend/bindings/luckydraw/internal/app/`。前端以 `AppService` 命名空间导入，每个方法内部调用 `Call.ByID(numericID, ...)`。

绑定目录已 `.gitignore`，**勿手改**——它在每次构建时按后端方法重新生成。

## 重新生成

```bash
task common:generate:bindings
```

实际执行 `wails3 generate bindings -ts -clean=true ./...`（`-f` 透传 build flags）。`task build` 与 `task dev` 均会自动触发此任务。

## 何时需要手动重生成

- 修改了后端 `internal/app/` 中导出方法的**签名**或**增删方法**后
- 拉取他人改动后（绑定未入库，本地需重建）
- 前端 import 报 `Cannot find module 'bindings/...'` 时

::: warning
改了后端方法却没重生成绑定，前端调用会报 `method not found` 或签名不匹配。

改完方法后务必跑一次 `task common:generate:bindings`。
:::
