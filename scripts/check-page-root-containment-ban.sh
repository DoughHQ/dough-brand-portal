#!/usr/bin/env bash
# Fails if a portal page root (flex child of .portal-main) sets container-type.
# That collapses the canvas to min-content in WebKit and falsely trips
# @container (max-width: 559px) on desktop.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FAIL=0

PAGE_ROOTS='cat-page|bh-page|pm-page|reports-page|studies-page'

# Same CSS rule block as a page-root selector must not set container-type.
if rg -n --glob '*.css' -U --multiline \
  "\\.(${PAGE_ROOTS})(\\.[a-zA-Z0-9_-]+)*\\s*\\{[^}]{0,800}container-type" \
  "$ROOT" >/dev/null 2>&1; then
  echo "BAN FAIL: page roots must not use container-type — put it on an inner *-cq"
  rg -n --glob '*.css' -U --multiline \
    "\\.(${PAGE_ROOTS})(\\.[a-zA-Z0-9_-]+)*\\s*\\{[^}]{0,800}container-type" \
    "$ROOT" || true
  FAIL=1
fi

# Catalog canvas must keep containment on the inner cq (queries still work).
if ! rg -n "\\.cat-page-cq\\s*\\{" -A 6 "$ROOT/components/categories/categoriesPage.css" \
  | rg -q "container-type"; then
  echo "BAN FAIL: .cat-page-cq must own container-type for @container cat-page"
  FAIL=1
fi

# Prefer <CatPage> — bare <div className="cat-page…"> skips the cq wrapper.
# Match class token cat-page (not cat-page-cq).
if rg -n --glob '*.tsx' '<div[^>]*className="[^"]*\bcat-page\b(?!-cq)' "$ROOT/app" "$ROOT/components" >/dev/null 2>&1; then
  echo "BAN FAIL: use <CatPage> instead of <div className=\"cat-page\">"
  rg -n --glob '*.tsx' '<div[^>]*className="[^"]*\bcat-page\b(?!-cq)' "$ROOT/app" "$ROOT/components" || true
  FAIL=1
fi

if [[ "$FAIL" -ne 0 ]]; then
  echo "check-page-root-containment-ban: FAILED"
  exit 1
fi
echo "check-page-root-containment-ban: ok"
