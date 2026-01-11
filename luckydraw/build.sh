#!/bin/bash

cd "$(dirname "$0")"

echo "编译 Go 小子……"
go build -o /dev/null ./... || exit 1

echo "和 Wails 偷情……"
wails generate module || exit 1

echo "正在抽打前端程序"
cd frontend
bun run build || exit 1
cd ..

echo "打赛博灰ing"
wails build

echo "请入住"
echo "少爷小姐这边请: ./build/bin/"

