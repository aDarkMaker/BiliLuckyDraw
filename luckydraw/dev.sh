#!/bin/bash

cd "$(dirname "$0")"

echo "🔨 编译 Go 代码..."
go build -o /dev/null ./... || exit 1

echo "🔄 重新生成 Wails 绑定..."
wails generate module || exit 1

echo "🚀 启动开发模式..."
wails dev

