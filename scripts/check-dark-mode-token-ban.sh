#!/usr/bin/env bash
# Dark-mode token contract — fail closed.
# --sage-dark = FILL only. --cream / --on-fill = always-light ink. Canvases = --surface/--paper.
# See lib/portal-ui/tokens.css header.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FAIL=0

echo "check-dark-mode-token-ban: scanning…"

# 1) Never use sage-dark as a text color.
HITS=$(rg -n --glob '*.{css,tsx,ts}' -g '!node_modules' -g '!*.d.ts' \
  'color:\s*(var\(--sage-dark|'\''var\(--sage-dark|"var\(--sage-dark)' \
  "$ROOT" || true)
if [[ -n "$HITS" ]]; then
  echo "$HITS"
  echo "BAN FAIL: color: var(--sage-dark) — use --heading (canvas) or --on-fill (on sage fills)"
  FAIL=1
fi

HITS=$(rg -n --glob '*.{tsx,ts}' -g '!node_modules' \
  "color:[^\n]*var\(--sage-dark\)" \
  "$ROOT" || true)
if [[ -n "$HITS" ]]; then
  echo "$HITS"
  echo "BAN FAIL: inline color uses --sage-dark — use --heading or --sage"
  FAIL=1
fi

# 2) Hardcoded light cream cards break dark mode.
HITS=$(rg -n --glob '*.{css,tsx}' -g '!node_modules' '#fffcf8' "$ROOT" || true)
if [[ -n "$HITS" ]]; then
  echo "$HITS"
  echo "BAN FAIL: hardcoded #fffcf8 — use var(--paper)"
  FAIL=1
fi

# 3) Never remap --cream to a dark canvas hex.
HITS=$(rg -n --glob '*.css' -- '--cream:\s*#1[0-9a-fA-F]{5}' "$ROOT/app" "$ROOT/lib" || true)
if [[ -n "$HITS" ]]; then
  echo "$HITS"
  echo "BAN FAIL: --cream remapped to a dark hex — keep cream/on-fill light; remap --surface"
  FAIL=1
fi

# 4) Never use --cream as a background (with or without fallbacks). Use --surface / --paper.
# Allow previewRunner (respondent phone chrome stays light by product design).
HITS=$(rg -n --glob '*.{css,tsx,ts}' -g '!node_modules' -g '!**/previewRunner.css' \
  'background:[^;{]*var\(--cream' \
  "$ROOT" || true)
if [[ -n "$HITS" ]]; then
  echo "$HITS"
  echo "BAN FAIL: background uses --cream — cream is on-fill ink; use --surface / --paper / --surface-1"
  FAIL=1
fi

# 5) Builder must not alias sage-dark to a heading token.
HITS=$(rg -n --glob '**/conceptBuilder.css' -- '--sage-dark:\s*var\(--cb-heading\)' "$ROOT" || true)
if [[ -n "$HITS" ]]; then
  echo "$HITS"
  echo "BAN FAIL: --sage-dark aliased to --cb-heading (fill≠ink cycle)"
  FAIL=1
fi

# 6) Bare background:#fff locks light chrome. Exempt: print sheets (globals,
# reportStory), previewRunner (respondent phone stays light), tokens.css.
HITS=$(rg -n --glob '*.{css,module.css,tsx,ts}' -g '!node_modules' \
  -g '!**/previewRunner.css' -g '!**/tokens.css' \
  -g '!**/globals.css' -g '!**/reportStory.module.css' \
  'background:\s*#fff(\s*!important)?\s*;' \
  "$ROOT" || true)
if [[ -n "$HITS" ]]; then
  echo "$HITS"
  echo "BAN FAIL: bare background:#fff — use var(--paper) (print + previewRunner exempt)"
  FAIL=1
fi

# 7) --white is a legacy alias. Call sites must use --paper (canvas) or --on-fill
# (ink on fills). Definitions may remain in tokens / globals / conceptBuilder.
HITS=$(rg -n --glob '*.{css,module.css,tsx,ts}' -g '!node_modules' \
  -g '!**/tokens.css' -g '!**/globals.css' -g '!**/conceptBuilder.css' \
  'var\(--white' \
  "$ROOT" || true)
if [[ -n "$HITS" ]]; then
  echo "$HITS"
  echo "BAN FAIL: var(--white) at call site — use --paper (canvas) or --on-fill (on fills)"
  FAIL=1
fi

if [[ "$FAIL" -ne 0 ]]; then
  echo "check-dark-mode-token-ban: FAILED"
  exit 1
fi
echo "check-dark-mode-token-ban: ok"
