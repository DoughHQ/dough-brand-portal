#!/usr/bin/env bash
# Fails if ReportsClient scans products for L2 relevance.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FILE="$ROOT/app/(portal)/reports/ReportsClient.tsx"
LIBRARY="$ROOT/app/(portal)/reports/library"
if [[ ! -f "$FILE" ]]; then
  echo "missing $FILE"
  exit 1
fi
TARGETS=("$FILE")
if [[ -d "$LIBRARY" ]]; then
  TARGETS+=("$LIBRARY")
fi
if rg -n "from\('products'\)|from\(\"products\"\)" "${TARGETS[@]}" >/dev/null 2>&1; then
  echo "BAN FAIL: ReportsClient must not census products — use get_brand_report_scope / cold l2_node_ids"
  rg -n "from\('products'\)|from\(\"products\"\)" "${TARGETS[@]}" || true
  exit 1
fi
echo "check-reports-no-product-scan: ok"
