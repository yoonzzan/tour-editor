#!/usr/bin/env bash
set -e

echo "=== Quality Gate ==="

echo "[0/4] Editor TSX: forbid shadow-popover (use shadow-none + border)..."
hits="$(
  grep -rEl --include="*.tsx" "shadow-popover" src/components/editor "src/app/(popup)" 2>/dev/null || true
)"
if [ -n "${hits}" ]; then
  echo "ERROR: shadow-popover must not appear under editor or popup routes:"
  echo "${hits}"
  echo "See .claude/rules/editor.md (모달·오버레이 패널)."
  exit 1
fi

echo "[1/4] TypeScript..."
npm run typecheck

echo "[2/4] ESLint..."
npm run lint

echo "[3/4] Tests..."
npm run test

echo "✅ Quality Gate passed"
