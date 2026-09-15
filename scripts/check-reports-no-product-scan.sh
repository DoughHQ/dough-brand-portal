#!/usr/bin/env bash
# Fails if ReportsClient scans products for L2 relevance.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FILE="$ROOT/app/(portal)/reports/ReportsClient.tsx"
if [[ ! -f "$FILE" ]]; then
  echo "missing $FILE"
  exit 1
fi
if rg -n "from\('products'\)|from\(\"products\"\)" "$FILE" >/dev/null 2>&1; then
  echo "BAN FAIL: ReportsClient must not census products — use get_brand_report_scope / cold l2_node_ids"
  rg -n "from\('products'\)|from\(\"products\"\)" "$FILE" || true
  exit 1
fi
echo "check-reports-no-product-scan: ok"
