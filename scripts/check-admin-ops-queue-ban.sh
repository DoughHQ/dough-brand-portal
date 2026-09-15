#!/usr/bin/env bash
# Fails if admin ops queues regress to unbounded list RPCs.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FAIL=0

check_page() {
  local label="$1"
  local page="$2"
  local must="$3"
  local ban="$4"
  if [[ ! -f "$page" ]]; then
    echo "BAN FAIL: missing $label ($page)"
    FAIL=1
    return
  fi
  if ! rg -n "$must" "$page" >/dev/null 2>&1; then
    echo "BAN FAIL: $label must use $must"
    FAIL=1
  fi
  if rg -n "$ban" "$page" >/dev/null 2>&1; then
    echo "BAN FAIL: $label must not call $ban"
    rg -n "$ban" "$page" || true
    FAIL=1
  fi
}

check_page \
  "ownership-corrections" \
  "$ROOT/app/(portal)/admin/ownership-corrections/page.tsx" \
  "listPendingOwnershipCorrectionsPage|list_pending_ownership_corrections_page" \
  "listPendingOwnershipCorrections\(|list_pending_ownership_corrections\b"

check_page \
  "brand-applications" \
  "$ROOT/app/(portal)/admin/brand-applications/page.tsx" \
  "listBrandWaitlistApplicationsPage|list_brand_waitlist_applications_page" \
  "listBrandWaitlistApplications\(|list_brand_waitlist_applications\b"

check_page \
  "boxes" \
  "$ROOT/app/(portal)/admin/boxes/page.tsx" \
  "fetchOperatorBoxesPage|list_operator_boxes_page" \
  "fetchOperatorBoxes\(|list_operator_boxes\b"

# Clients must expose Load more (cursor paging), not assume a full in-memory queue.
for client in \
  "$ROOT/app/(portal)/admin/ownership-corrections/OwnershipCorrectionsClient.tsx" \
  "$ROOT/app/(portal)/admin/brand-applications/BrandApplicationsClient.tsx" \
  "$ROOT/app/(portal)/admin/boxes/AdminBoxesClient.tsx"
do
  if [[ ! -f "$client" ]]; then
    echo "BAN FAIL: missing $(basename "$client")"
    FAIL=1
    continue
  fi
  if ! rg -n "Load more|hasMore" "$client" >/dev/null 2>&1; then
    echo "BAN FAIL: $(basename "$client") must support Load more / hasMore"
    FAIL=1
  fi
done

if [[ "$FAIL" -ne 0 ]]; then
  echo "check-admin-ops-queue-ban: FAILED"
  exit 1
fi
echo "check-admin-ops-queue-ban: ok"
