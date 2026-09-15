#!/usr/bin/env bash
# Fails if Products/Reports hydrate claimed_product_ids[] or call getSubscription for it.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FAIL=0

PRODUCTS_PAGE="$ROOT/app/(portal)/products/page.tsx"
PRODUCTS_CLIENT="$ROOT/app/(portal)/products/ProductsClient.tsx"
REPORTS_PAGE="$ROOT/app/(portal)/reports/page.tsx"
REPORTS_CLIENT="$ROOT/app/(portal)/reports/ReportsClient.tsx"
QUERIES="$ROOT/lib/queries.ts"

for f in "$PRODUCTS_PAGE" "$PRODUCTS_CLIENT" "$REPORTS_PAGE"; do
  if [[ ! -f "$f" ]]; then
    echo "BAN FAIL: missing $f"
    FAIL=1
  fi
done

# Products must not load the claim array
if rg -n "claimed_product_ids|claimedIds|getSubscription" "$PRODUCTS_PAGE" "$PRODUCTS_CLIENT" >/dev/null 2>&1; then
  echo "BAN FAIL: Products must not hydrate claimed_product_ids / getSubscription"
  rg -n "claimed_product_ids|claimedIds|getSubscription" "$PRODUCTS_PAGE" "$PRODUCTS_CLIENT" || true
  FAIL=1
fi

if ! rg -n "isClaimed|is_claimed" "$PRODUCTS_CLIENT" >/dev/null 2>&1; then
  echo "BAN FAIL: ProductsClient must use per-row isClaimed from page RPC"
  FAIL=1
fi

# Reports must not load subscription for claim array (prop was unused fat fetch)
if rg -n "getSubscription|claimed_product_ids" "$REPORTS_PAGE" >/dev/null 2>&1; then
  echo "BAN FAIL: Reports page must not call getSubscription / claimed_product_ids"
  rg -n "getSubscription|claimed_product_ids" "$REPORTS_PAGE" || true
  FAIL=1
fi

if [[ -f "$REPORTS_CLIENT" ]] && rg -n "claimed_product_ids" "$REPORTS_CLIENT" >/dev/null 2>&1; then
  echo "BAN FAIL: ReportsClient must not reference claimed_product_ids"
  FAIL=1
fi

# getSubscription must not select the claim array column
if [[ -f "$QUERIES" ]]; then
  if rg -n "\.select\([^\)]*claimed_product_ids" "$QUERIES" >/dev/null 2>&1; then
    echo "BAN FAIL: getSubscription (or queries) must not select claimed_product_ids"
    rg -n "\.select\([^\)]*claimed_product_ids" "$QUERIES" || true
    FAIL=1
  fi
  if ! rg -n "Never select claimed_product_ids" "$QUERIES" >/dev/null 2>&1; then
    echo "BAN FAIL: getSubscription must document Never select claimed_product_ids"
    FAIL=1
  fi
fi

if [[ "$FAIL" -ne 0 ]]; then
  echo "check-claim-array-ban: FAILED"
  exit 1
fi
echo "check-claim-array-ban: ok"
