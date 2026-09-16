#!/usr/bin/env bash
# Fails if Corrections pages load unbounded correction_review_queue,
# or if the brand inbox grows an apply path.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FAIL=0

if rg -n "from\('correction_review_queue'\)|from\(\"correction_review_queue\"\)" "$ROOT/lib/corrections.ts" >/dev/null 2>&1; then
  echo "BAN FAIL: lib/corrections.ts must use list_* RPCs, not unbounded view select"
  rg -n "correction_review_queue" "$ROOT/lib/corrections.ts" || true
  FAIL=1
fi

ADMIN_PAGE="$ROOT/app/(portal)/admin/corrections/page.tsx"
if [[ ! -f "$ADMIN_PAGE" ]]; then
  echo "BAN FAIL: missing admin corrections page"
  FAIL=1
elif ! rg -n "getPendingCorrectionReviewsPage|list_pending_correction_reviews" "$ADMIN_PAGE" >/dev/null 2>&1; then
  echo "BAN FAIL: admin corrections page must use getPendingCorrectionReviewsPage"
  FAIL=1
fi

BRAND_PAGE="$ROOT/app/(portal)/corrections/page.tsx"
BRAND_CLIENT="$ROOT/app/(portal)/corrections/BrandCorrectionsClient.tsx"
BRAND_ACTIONS="$ROOT/app/(portal)/corrections/actions.ts"

if [[ ! -f "$BRAND_PAGE" ]]; then
  echo "BAN FAIL: missing brand corrections page"
  FAIL=1
else
  if ! rg -n "getBrandPendingCorrectionsPage|list_brand_pending_corrections" "$BRAND_PAGE" >/dev/null 2>&1; then
    echo "BAN FAIL: brand corrections page must use getBrandPendingCorrectionsPage"
    FAIL=1
  fi
  if rg -n "list_pending_correction_reviews|getPendingCorrectionReviewsPage|correction_review_queue" "$BRAND_PAGE" >/dev/null 2>&1; then
    echo "BAN FAIL: brand corrections page must not use the admin queue"
    FAIL=1
  fi
  if rg -n "CorrectionsReviewClient|CaseEditor|reviewCorrection" "$BRAND_PAGE" >/dev/null 2>&1; then
    echo "BAN FAIL: brand corrections page must not mount the apply desk"
    FAIL=1
  fi
fi

if [[ ! -f "$BRAND_CLIENT" ]]; then
  echo "BAN FAIL: missing BrandCorrectionsClient"
  FAIL=1
else
  if ! rg -n "Load more|hasMore" "$BRAND_CLIENT" >/dev/null 2>&1; then
    echo "BAN FAIL: BrandCorrectionsClient must support Load more / hasMore"
    FAIL=1
  fi
  if rg -n "reviewCorrectionAction|CaseEditor|extractCorrection|review_correction" "$BRAND_CLIENT" >/dev/null 2>&1; then
    echo "BAN FAIL: BrandCorrectionsClient must not apply, extract, or file"
    FAIL=1
  fi
fi

if [[ -f "$BRAND_ACTIONS" ]] && rg -n "reviewCorrection|review_correction|extractCorrection" "$BRAND_ACTIONS" >/dev/null 2>&1; then
  echo "BAN FAIL: brand corrections actions must stay read-only"
  FAIL=1
fi

if [[ "$FAIL" -ne 0 ]]; then
  echo "check-corrections-pagination-ban: FAILED"
  exit 1
fi
echo "check-corrections-pagination-ban: ok"
