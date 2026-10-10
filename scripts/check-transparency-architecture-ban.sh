#!/usr/bin/env bash
# Keeps shared transparency presentation rules centralized and OperationsSheet orchestration-only.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TRANSPARENCY="$ROOT/components/transparency"
OPERATIONS="$TRANSPARENCY/OperationsSheet.tsx"
FAIL=0

for REQUIRED in \
  "$TRANSPARENCY/TransparencyRoom.tsx" \
  "$ROOT/lib/transparency/presencePresentation.ts"; do
  if [[ ! -f "$REQUIRED" ]]; then
    echo "BAN FAIL: missing shared transparency primitive"
    echo "  ${REQUIRED#"$ROOT/"}"
    FAIL=1
  fi
done

if rg -q 'tx-pill tx-pill--(public|private|declined|idle)' "$TRANSPARENCY" --glob '*.tsx'; then
  echo "BAN FAIL: transparency components must use presencePresentation"
  rg -n 'tx-pill tx-pill--(public|private|declined|idle)' \
    "$TRANSPARENCY" --glob '*.tsx' || true
  FAIL=1
fi

if rg -q '<(section|header) className="tx-ops__room(-head)?"' \
  "$TRANSPARENCY" --glob '*.tsx' --glob '!TransparencyRoom.tsx'; then
  echo "BAN FAIL: transparency sheets must use TransparencyRoom"
  rg -n '<(section|header) className="tx-ops__room(-head)?"' \
    "$TRANSPARENCY" --glob '*.tsx' --glob '!TransparencyRoom.tsx' || true
  FAIL=1
fi

for EDITOR in \
  MadeKeptEditor \
  WholeEnumCard \
  RefinementSheet \
  FlavorSheet \
  AidSheet \
  SubjectEnumEditor \
  SubjectTextEditor; do
  if [[ ! -f "$TRANSPARENCY/operations/$EDITOR.tsx" ]]; then
    echo "BAN FAIL: missing extracted OperationsSheet editor: $EDITOR"
    FAIL=1
  fi
  case "$EDITOR" in
    SubjectEnumEditor|SubjectTextEditor) ;;
    *)
      if ! rg -q "from '@/components/transparency/operations/$EDITOR'" "$OPERATIONS"; then
        echo "BAN FAIL: OperationsSheet must import extracted editor: $EDITOR"
        FAIL=1
      fi
      ;;
  esac
done

if rg -n '\b(function|const|class) (MadeKeptEditor|WholeEnumCard|RefinementSheet|FlavorSheet|AidSheet|SubjectEnumEditor|SubjectTextEditor)\b' \
  "$OPERATIONS" >/dev/null 2>&1; then
  echo "BAN FAIL: OperationsSheet must remain an orchestration shell"
  FAIL=1
fi

OPERATIONS_LINES="$(wc -l < "$OPERATIONS" | tr -d ' ')"
if (( OPERATIONS_LINES > 350 )); then
  echo "BAN FAIL: OperationsSheet grew past its 350-line orchestration budget ($OPERATIONS_LINES)"
  FAIL=1
fi

if [[ "$FAIL" -ne 0 ]]; then
  echo "check-transparency-architecture-ban: FAILED"
  exit 1
fi

echo "check-transparency-architecture-ban: ok"
