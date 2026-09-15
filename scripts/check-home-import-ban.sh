#!/usr/bin/env bash
# Fails if Home/layout import banned fan-out helpers.
# Phase 0 doctrine — keep in sync with .cursor/rules/portal-home-doctrine.mdc
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FAIL=0

check() {
  local file="$1"
  local pattern="$2"
  local label="$3"
  if rg -n --glob '*.ts' --glob '*.tsx' "$pattern" "$file" 2>/dev/null | rg -v '^\s*//' | rg -v 'deprecated|FORBIDDEN|landmine' >/dev/null; then
    echo "BAN FAIL: $label in $file"
    rg -n "$pattern" "$file" || true
    FAIL=1
  fi
}

HOME_PAGE="$ROOT/app/(portal)/dashboard/page.tsx"
LAYOUT="$ROOT/app/(portal)/layout.tsx"
LEGACY="$ROOT/lib/brandHome/brandHomeLegacy.server.ts"

for f in "$HOME_PAGE" "$LAYOUT"; do
  if [[ ! -f "$f" ]]; then
    echo "missing $f"
    FAIL=1
    continue
  fi
done

if [[ -f "$LEGACY" ]]; then
  echo "BAN FAIL: brandHomeLegacy.server.ts must stay deleted (fail closed — no fan-out)"
  FAIL=1
fi

# Layout must not pull fat home snapshot or list RPCs / landmines
check "$LAYOUT" "get_brand_home_snapshot|getBrandHomeSnapshot" "layout must not call fat brand home snapshot"
check "$LAYOUT" "getPlatformStats|getBrandProductCount|getAllBrandProducts|fetchBrandCategoryL2s" "layout landmine"
check "$LAYOUT" "getOperatorStudies|list_operator_studies|fetchCatalogHealth|fetchProductSignalCards" "layout fan-out"

# Dashboard must not fan out or resurrect legacy
check "$HOME_PAGE" "getOperatorStudies|fetchCatalogHealth|fetchProductSignalCards|getBrandProductsByIds|getProductIntelligence|loadBrandHomeLegacyFanout|brandHomeLegacy" "dashboard fan-out"
check "$HOME_PAGE" "\bgetBrand\b|\bgetBrandSnapshot\b|\bgenerateNarrative\b" "dashboard must use snapshot document only"

if [[ "$FAIL" -ne 0 ]]; then
  echo "check-home-import-ban: FAILED"
  exit 1
fi
echo "check-home-import-ban: ok"
