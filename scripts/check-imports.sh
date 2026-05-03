#!/usr/bin/env bash
#
# check-imports.sh — Validates that local .js imports include the .js extension.
#
# Extensionless local imports (e.g. `import './foo'` instead of `import './foo.js'`)
# work in Vite but break Node.js ESM scripts and test runners. This script catches
# them early so they don't reach CI.
#
# Usage:
#   bash scripts/check-imports.sh          # Check all source files
#   bash scripts/check-imports.sh --fix    # Show violations and exit with error
#
# Exit codes:
#   0 — No violations found
#   1 — Violations found (or usage error)

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
VIOLATIONS=0
EXIT_CODE=0

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║     Mushajjir Import Extension Validator          ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# Find all .js and .vue files, excluding node_modules and dist
while IFS= read -r -d '' file; do
  # Match patterns like:
  #   import ... from './foo'       (missing .js)
  #   import ... from '../bar'      (missing .js)
  #   import ... from './baz/index' (missing .js — should be ./baz/index.js)
  # But NOT:
  #   import ... from './foo.js'    (valid)
  #   import ... from 'vue'         (package import)
  #   import ... from '@scope/pkg'  (scoped package)
  #
  # Regex explanation:
  #   from\s+['"]\.\.?/   — matches `from './...` or `from '../...`
  #   (?!.*\.(js|vue|css|json)['"])  — negative lookahead: NOT ending with known extension
  #   .*['"]              — the rest of the import path
  violations=$(grep -nE "from\s+['\"]\.\.?/(?!.*\.(js|vue|css|json)['\"])[^'\"]*['\"]" "$file" || true)

  if [ -n "$violations" ]; then
    if [ $VIOLATIONS -eq 0 ]; then
      echo -e "${RED}Violations found:${NC}"
      echo ""
    fi
    while IFS= read -r line; do
      echo -e "  ${YELLOW}${file}:${line}${NC}"
      VIOLATIONS=$((VIOLATIONS + 1))
    done <<< "$violations"
  fi
done < <(find "$ROOT_DIR/src" "$ROOT_DIR/scripts" "$ROOT_DIR/benchmark" "$ROOT_DIR/.mcp" \
  -type f \( -name '*.js' -o -name '*.vue' -o -name '*.mjs' \) \
  -not -path '*/node_modules/*' \
  -not -path '*/dist/*' \
  -print0 2>/dev/null || true)

echo ""

if [ $VIOLATIONS -eq 0 ]; then
  echo -e "${GREEN}✓ No extensionless local imports found.${NC}"
  echo ""
  exit 0
else
  echo -e "${RED}✗ Found ${VIOLATIONS} extensionless local import(s).${NC}"
  echo ""
  echo "  Extensionless .js imports work in Vite but break in Node.js."
  echo "  Add the .js extension to each import above."
  echo ""
  exit 1
fi
