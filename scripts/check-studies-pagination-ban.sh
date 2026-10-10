#!/usr/bin/env bash
# Fails if study reads regress to unbounded or tenant-ambiguous operator queries.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PAGE="$ROOT/app/(portal)/studies/page.tsx"
CLIENT="$ROOT/app/(portal)/studies/StudiesClient.tsx"
HERO="$ROOT/lib/productMaster/fetchProductHeroStudies.server.ts"
COMMAND_SEARCH="$ROOT/app/(portal)/searchPortalCommandAction.ts"
PAGE_ACTION="$ROOT/app/(portal)/studies/listStudiesPageAction.ts"
DRAFT_ACTIONS="$ROOT/app/(portal)/studies/drafts/actions.ts"
CONCEPT_ACTIONS="$ROOT/app/(portal)/studies/concept/actions.ts"
BOX_ACTIONS="$ROOT/app/(portal)/studies/box/actions.ts"
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

for SCOPED_CALLER in "$PAGE" "$PAGE_ACTION" "$COMMAND_SEARCH" "$DRAFT_ACTIONS"; do
  if ! rg -q "operatorStudiesBrandId" "$SCOPED_CALLER"; then
    echo "BAN FAIL: operator studies caller must derive its tenant scope centrally"
    echo "  ${SCOPED_CALLER#"$ROOT/"}"
    FAIL=1
  fi
done

for WRITE_SURFACE in "$CONCEPT_ACTIONS" "$BOX_ACTIONS"; do
  if ! rg -q "studyBrandIdForRequest" "$WRITE_SURFACE"; then
    echo "BAN FAIL: study write surface must validate client brand ids"
    echo "  ${WRITE_SURFACE#"$ROOT/"}"
    FAIL=1
  fi
done

if [[ "$FAIL" -ne 0 ]]; then
  echo "check-studies-pagination-ban: FAILED"
  exit 1
fi
echo "check-studies-pagination-ban: ok"
