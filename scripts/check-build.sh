#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────
# check-build.sh — Run the Vite build and report status
#
# Usage:
#   ./scripts/check-build.sh
#
# Exits with code 0 on success, 1 on failure.
# Useful as a pre-commit check or quick validation after edits.
# ──────────────────────────────────────────────────────────────

set -euo pipefail

echo "→ Running Vite build..."
OUTPUT=$(npx vite build 2>&1) && RC=0 || RC=$?

if [ $RC -eq 0 ]; then
  echo "✅ Build succeeded."
  echo "$OUTPUT" | grep -E "(✓ built|dist/)" || true
else
  echo "❌ Build failed (exit code $RC)."
  echo "$OUTPUT"
  exit 1
fi
