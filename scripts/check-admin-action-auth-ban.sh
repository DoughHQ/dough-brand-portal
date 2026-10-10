#!/usr/bin/env bash
# Every admin Server Action module must contain an explicit application-layer
# authorization gate. RLS/RPC checks remain mandatory defense in depth.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ADMIN_ROOT="$ROOT/app/(portal)/admin"

ACTION_FILES="$(
  {
    rg -l --glob '*.ts' --glob '*.tsx' "^['\"]use server['\"]" "$ADMIN_ROOT"
    printf '%s\n' \
      "$ROOT/app/(portal)/studies/checkoutActions.ts" \
      "$ROOT/app/(portal)/studies/closeStudyAction.ts" \
      "$ROOT/app/(portal)/studies/missionTrashActions.ts"
  } | sort -u
)"

if [[ -z "$ACTION_FILES" ]]; then
  echo "BAN FAIL: no admin Server Action modules found."
  exit 1
fi

failed=0
while IFS= read -r file; do
  if ! rg -q \
    'isDoughAdminRequest|requireDoughAdmin|getPortalBrandScope|getPortalUser' \
    "$file"; then
    echo "BAN FAIL: admin Server Action module has no explicit authorization gate:"
    echo "  ${file#"$ROOT/"}"
    failed=1
  fi
done <<< "$ACTION_FILES"

if (( failed != 0 )); then
  exit 1
fi

count="$(printf '%s\n' "$ACTION_FILES" | wc -l | tr -d ' ')"
echo "check-admin-action-auth-ban: ok ($count modules)"
