#!/usr/bin/env bash
set -e

echo "=== Quality Gate ==="

echo "[1/3] TypeScript..."
npm run typecheck

echo "[2/3] ESLint..."
npm run lint

echo "[3/3] Tests..."
npm run test

echo "✅ Quality Gate passed"
