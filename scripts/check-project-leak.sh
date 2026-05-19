#!/usr/bin/env bash
# check-project-leak.sh
#
# Detect "project leaks": draft items from the Private Project v2 that
# accidentally became public issues in rodacato/notdefined.
#
# The editorial workflow runs on a Private user-level Project with draft
# items only. The public repo should carry ZERO internal-workflow issues.
# External issues (filed by readers) are allowed but worth reviewing.

set -euo pipefail

REPO="rodacato/notdefined"

if ! command -v gh &>/dev/null; then
  echo "Error: gh CLI not found. Install: https://cli.github.com/" >&2
  exit 2
fi

if ! gh auth status &>/dev/null; then
  echo "Error: gh CLI not authenticated. Run: gh auth login" >&2
  exit 2
fi

echo "==> Checking issues in $REPO (all states, last 100)"

COUNT=$(gh issue list -R "$REPO" --state all --limit 100 --json number --jq 'length')

if [ "$COUNT" -eq 0 ]; then
  echo "    OK — zero issues. No project leak detected."
  exit 0
fi

echo "    Found $COUNT issue(s). Listing for review:"
echo
gh issue list -R "$REPO" --state all --limit 100 \
  --json number,title,author,state,createdAt \
  --jq '.[] | "  #\(.number) [\(.state)] (\(.author.login), \(.createdAt[:10])) — \(.title)"'

echo
echo "==> Review each issue:"
echo "    - If filed by an external user (random GitHub login): legitimate, leave it."
echo "    - If filed by rodacato AND looks like an editorial idea: this is a leak."
echo "      Delete with: gh issue delete -R $REPO <number>"
echo "    - If filed by rodacato as a real bug report / PR-related: legitimate."
echo
echo "==> The Private Project v2 uses draft items only — these should never become issues."
