#!/usr/bin/env bash
# Service-role access is deny-by-default. Every caller must be reviewed here.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SEARCH_ROOTS=("$ROOT/app" "$ROOT/components" "$ROOT/lib")
EXPECTED_CALLERS="lib/checkout/invoiceContact.server.ts"
EXPECTED_KEY_OWNER="lib/supabase-admin.ts"

relative_matches() {
  local pattern="$1"
  rg -l --glob '*.ts' --glob '*.tsx' "$pattern" "${SEARCH_ROOTS[@]}" 2>/dev/null \
    | sed "s#^$ROOT/##" \
    | sort \
    || true
}

CALLERS="$(relative_matches "from ['\"]@/lib/supabase-admin['\"]")"
if [[ "$CALLERS" != "$EXPECTED_CALLERS" ]]; then
  echo "BAN FAIL: service-role client callers changed."
  echo "Expected:"
  printf '%s\n' "$EXPECTED_CALLERS"
  echo "Found:"
  printf '%s\n' "${CALLERS:-<none>}"
  echo "Review the trust boundary, then update this allowlist deliberately."
  exit 1
fi

KEY_OWNERS="$(relative_matches 'SUPABASE_SERVICE_ROLE_KEY')"
if [[ "$KEY_OWNERS" != "$EXPECTED_KEY_OWNER" ]]; then
  echo "BAN FAIL: SUPABASE_SERVICE_ROLE_KEY must live only in lib/supabase-admin.ts."
  echo "Found:"
  printf '%s\n' "${KEY_OWNERS:-<none>}"
  exit 1
fi

if ! rg -q "^import ['\"]server-only['\"]" "$ROOT/lib/supabase-admin.ts"; then
  echo "BAN FAIL: lib/supabase-admin.ts must import server-only."
  exit 1
fi

echo "check-service-role-callers-ban: ok"
