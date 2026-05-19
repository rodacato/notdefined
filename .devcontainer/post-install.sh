#!/usr/bin/env bash
set -euo pipefail

echo "==> Installing npm dependencies"
npm install

echo "==> Installing bundler"
gem install bundler

echo "==> Setting up Claude Code config..."
CLAUDE_PROJECT_DIR="$(pwd)/.claude"
CLAUDE_HOME="$HOME/.claude"

mkdir -p "$CLAUDE_HOME"

if [ -d "$CLAUDE_PROJECT_DIR" ]; then
  cp -rn "$CLAUDE_PROJECT_DIR/." "$CLAUDE_HOME/"
  echo "  - Claude config copied from project."
else
  echo "  - No .claude in project, created empty ~/.claude."
fi

echo "==> post-install complete"
