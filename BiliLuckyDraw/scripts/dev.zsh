#!/usr/bin/env zsh
set -euo pipefail

cd "$(dirname "$0")/.."

cd frontend
bun install
bun run check
cd ..

wails dev