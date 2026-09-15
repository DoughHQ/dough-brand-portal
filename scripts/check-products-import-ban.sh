#!/usr/bin/env bash
# Fails if Brand Products page still dual-loads full catalogs.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PAGE="$ROOT/app/(portal)/products/page.tsx"
CLIENT="$ROOT/app/(portal)/products/ProductsClient.tsx"
FAIL=0

if [[ ! -f "$PAGE" || ! -f "$CLIENT" ]]; then
  echo "missing products page/client"
  exit 1
fi

if rg -n "getBrandProducts\b|get_brand_products_with_taxonomy|range\(0,\s*9999\)" "$PAGE" >/dev/null 2>&1; then
  echo "BAN FAIL: products page must not full-scan catalog via getBrandProducts"
  rg -n "getBrandProducts\b|get_brand_products_with_taxonomy|range\(0,\s*9999\)" "$PAGE" || true
  FAIL=1
fi

if rg -n "get_brand_products_portfolio" "$CLIENT" >/dev/null 2>&1; then
  echo "BAN FAIL: ProductsClient must not call get_brand_products_portfolio"
  rg -n "get_brand_products_portfolio" "$CLIENT" || true
  FAIL=1
fi

if ! rg -n "list_brand_products_page|listBrandProductsPage" "$PAGE" >/dev/null 2>&1; then
  echo "BAN FAIL: products page must use listBrandProductsPage"
  FAIL=1
fi

if [[ "$FAIL" -ne 0 ]]; then
  echo "check-products-import-ban: FAILED"
  exit 1
fi
echo "check-products-import-ban: ok"
