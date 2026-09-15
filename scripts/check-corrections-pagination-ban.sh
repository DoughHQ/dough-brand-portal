#!/usr/bin/env bash
# Fails if Corrections admin page loads unbounded correction_review_queue.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PAGE="$ROOT/app/(portal)/admin/corrections/page.tsx"
LIB="$ROOT/lib/corrections.ts"
FAIL=0

if rg -n "from\('correction_review_queue'\)|from\(\"correction_review_queue\"\)" "$LIB" >/dev/null 2>&1; then
  echo "BAN FAIL: lib/corrections.ts must use list_pending_correction_reviews RPC, not unbounded view select"
  rg -n "correction_review_queue" "$LIB" || true
  FAIL=1
fi

if ! rg -n "getPendingCorrectionReviewsPage|list_pending_correction_reviews" "$PAGE" >/dev/null 2>&1; then
  echo "BAN FAIL: corrections page must use getPendingCorrectionReviewsPage"
  FAIL=1
fi

if [[ "$FAIL" -ne 0 ]]; then
  echo "check-corrections-pagination-ban: FAILED"
  exit 1
fi
echo "check-corrections-pagination-ban: ok"
