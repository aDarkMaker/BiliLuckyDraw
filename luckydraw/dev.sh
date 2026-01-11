#!/bin/bash

cd "$(dirname "$0")"

echo "编译 Go 小子……"
go build -o /dev/null ./... || exit 1

echo "和 Wails 偷情……"
wails generate module || exit 1

echo "我要狠狠地开发你！"
wails dev

