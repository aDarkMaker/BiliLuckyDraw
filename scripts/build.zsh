#!/usr/bin/env zsh
set -euo pipefail

cd "$(dirname "$0")/.."

cd frontend
bun install --frozen-lockfile
bun run check
bun run build
cd ..

wails build