#!/usr/bin/env bash
# Fails if Studies page regresses to unbounded list_operator_studies.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PAGE="$ROOT/app/(portal)/studies/page.tsx"
CLIENT="$ROOT/app/(portal)/studies/StudiesClient.tsx"
HERO="$ROOT/lib/productMaster/fetchProductHeroStudies.server.ts"
FAIL=0

if [[ ! -f "$PAGE" ]]; then
  echo "BAN FAIL: missing studies page"
  exit 1
fi

if ! rg -n "fetchOperatorStudiesPage|list_operator_studies_page" "$PAGE" >/dev/null 2>&1; then
  echo "BAN FAIL: studies page must use fetchOperatorStudiesPage"
  FAIL=1
fi

if rg -n "getOperatorStudies\(|list_operator_studies\b" "$PAGE" >/dev/null 2>&1; then
  echo "BAN FAIL: studies page must not call unbounded list_operator_studies"
  rg -n "getOperatorStudies\(|list_operator_studies\b" "$PAGE" || true
  FAIL=1
fi

if [[ -f "$CLIENT" ]] && ! rg -n "Load more|hasMore|loadMore" "$CLIENT" >/dev/null 2>&1; then
  echo "BAN FAIL: StudiesClient must support Load more"
  FAIL=1
fi

if [[ -f "$HERO" ]] && rg -n "getOperatorStudies\(" "$HERO" >/dev/null 2>&1; then
  echo "BAN FAIL: product hero must not fall back to getOperatorStudies"
  rg -n "getOperatorStudies\(" "$HERO" || true
  FAIL=1
fi

if [[ "$FAIL" -ne 0 ]]; then
  echo "check-studies-pagination-ban: FAILED"
  exit 1
fi
echo "check-studies-pagination-ban: ok"
