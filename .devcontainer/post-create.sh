#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> Installing npm dependencies"
npm install

echo "==> Installing bundler"
gem list -i bundler >/dev/null || gem install bundler

echo "==> post-create complete"
