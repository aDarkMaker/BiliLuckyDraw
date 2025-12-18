#!/bin/bash

cd "$(dirname "$0")"

echo "🔨 编译 Go 代码..."
go build -o /dev/null ./... || exit 1

echo "🔄 重新生成 Wails 绑定..."
wails generate module || exit 1

echo "📦 构建前端..."
cd frontend
bun run build || exit 1
cd ..

echo "🏗️  构建应用程序..."
wails build

echo "✅ 构建完成！"
echo "📍 应用程序位置: ./build/bin/"

