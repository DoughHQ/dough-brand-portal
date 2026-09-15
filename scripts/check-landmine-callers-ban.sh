#!/usr/bin/env bash
# Fails if app/ still *calls* catalog/ops landmines (definitions that throw are OK).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP="$ROOT/app"
FAIL=0

# Call sites in app/ (not lib definitions)
PATTERNS=(
  'getBrandProducts\('
  'getAllBrandProducts\('
  'getBrandProductCount\('
  'getPlatformStats\('
  'fetchBrandCategoryL2s\('
  'getOperatorStudies\('
  'fetchOperatorBoxes\('
  'loadBrandHomeLegacyFanout'
  'brandHomeLegacy'
)

for pat in "${PATTERNS[@]}"; do
  if rg -n --glob '*.ts' --glob '*.tsx' "$pat" "$APP" >/dev/null 2>&1; then
    echo "BAN FAIL: app/ must not call $pat"
    rg -n --glob '*.ts' --glob '*.tsx' "$pat" "$APP" || true
    FAIL=1
  fi
done

# Products / Reports / Studies / admin queues must not select claimed_product_ids
if rg -n --glob '*.ts' --glob '*.tsx' "claimed_product_ids" \
  "$APP/(portal)/products" \
  "$APP/(portal)/reports" \
  "$APP/(portal)/studies" \
  "$APP/(portal)/layout.tsx" \
  >/dev/null 2>&1; then
  echo "BAN FAIL: portal surfaces must not reference claimed_product_ids"
  rg -n --glob '*.ts' --glob '*.tsx' "claimed_product_ids" \
    "$APP/(portal)/products" \
    "$APP/(portal)/reports" \
    "$APP/(portal)/studies" \
    "$APP/(portal)/layout.tsx" || true
  FAIL=1
fi

if [[ "$FAIL" -ne 0 ]]; then
  echo "check-landmine-callers-ban: FAILED"
  exit 1
fi
echo "check-landmine-callers-ban: ok"
