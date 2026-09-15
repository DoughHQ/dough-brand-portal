#!/usr/bin/env bash
# Fails if portal page canvases use size containment / @container.
# WebKit + `container` / `container-type` collapses the canvas to min-content.
# A stale Next chunk with `container: name/inline-size` can keep serving the
# bug long after source is fixed — clear `.next` if layout looks stuck.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FAIL=0

PAGE_ROOTS='cat-page|cat-page-cq|bh-page|pm-page|reports-page|studies-page'
CATALOG_CSS="$ROOT/components/categories/categoriesPage.css"

if rg -n --glob '*.css' -U --multiline \
  "\\.(${PAGE_ROOTS})(\\.[a-zA-Z0-9_-]+)*\\s*\\{[^}]{0,800}container(-type)?\\s*:" \
  "$ROOT" >/dev/null 2>&1; then
  echo "BAN FAIL: page canvases must not use container / container-type — use @media"
  rg -n --glob '*.css' -U --multiline \
    "\\.(${PAGE_ROOTS})(\\.[a-zA-Z0-9_-]+)*\\s*\\{[^}]{0,800}container(-type)?\\s*:" \
    "$ROOT" || true
  FAIL=1
fi

if [[ -f "$CATALOG_CSS" ]]; then
  if rg -n "^\s*container(-type)?\s*:|^\s*@container\b" "$CATALOG_CSS" >/dev/null 2>&1; then
    echo "BAN FAIL: categoriesPage.css must not use container / container-type / @container"
    rg -n "^\s*container(-type)?\s*:|^\s*@container\b" "$CATALOG_CSS" || true
    FAIL=1
  fi
fi

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
