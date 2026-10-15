#!/usr/bin/env bash
# Keeps shared transparency presentation rules centralized and sheet modules orchestration-only.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TRANSPARENCY="$ROOT/components/transparency"
OPERATIONS="$TRANSPARENCY/OperationsSheet.tsx"
RIGHTS="$TRANSPARENCY/RightsSheet.tsx"
STUDIO="$TRANSPARENCY/ProductTransparencyStudio.tsx"
FAIL=0

if ! node "$ROOT/scripts/check-transparency-module-boundaries.mjs"; then
  FAIL=1
fi

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

for REQUIRED in \
  "$TRANSPARENCY/rights/types.ts" \
  "$TRANSPARENCY/rights/helpers.ts"; do
  if [[ ! -f "$REQUIRED" ]]; then
    echo "BAN FAIL: missing RightsSheet support module"
    echo "  ${REQUIRED#"$ROOT/"}"
    FAIL=1
  fi
done

for EDITOR in \
  ProvenanceFields \
  LivingEditor \
  LaborEditor \
  DiligenceEditor \
  SupplierEditor \
  SingleEnumCard \
  SingleTextCard; do
  if [[ ! -f "$TRANSPARENCY/rights/$EDITOR.tsx" ]]; then
    echo "BAN FAIL: missing extracted RightsSheet editor: $EDITOR"
    FAIL=1
  fi
  case "$EDITOR" in
    ProvenanceFields) ;;
    *)
      if ! rg -q "rights/$EDITOR'" "$RIGHTS"; then
        echo "BAN FAIL: RightsSheet must import extracted editor: $EDITOR"
        FAIL=1
      fi
      ;;
  esac
done

if rg -n '\b(function|const|class) (ProvenanceFields|LivingEditor|LaborEditor|DiligenceEditor|SupplierEditor|SingleEnumCard|SingleTextCard)\b' \
  "$RIGHTS" >/dev/null 2>&1; then
  echo "BAN FAIL: RightsSheet must remain an orchestration shell"
  FAIL=1
fi

RIGHTS_LINES="$(wc -l < "$RIGHTS" | tr -d ' ')"
if (( RIGHTS_LINES > 300 )); then
  echo "BAN FAIL: RightsSheet grew past its 300-line orchestration budget ($RIGHTS_LINES)"
  FAIL=1
fi

for MODULE in \
  types.ts \
  progress.ts \
  useTransparencyStudio.ts \
  DisclosureRowEditor.tsx \
  InventoryGroups.tsx \
  useStudioChapters.ts \
  StudioHeader.tsx \
  ChapterRail.tsx \
  ChapterPane.tsx \
  OriginChapter.tsx \
  PlanetChapter.tsx \
  RightsChapter.tsx \
  chapterProps.ts \
  disclosure/fields.tsx \
  disclosure/disclosureOptions.ts \
  disclosure/disclosureProps.ts \
  disclosure/SubjectField.tsx \
  disclosure/ValueField.tsx \
  disclosure/MethodFields.tsx \
  disclosure/ProvenanceSection.tsx \
  disclosure/StatusNote.tsx \
  disclosure/PublishFooter.tsx; do
  if [[ ! -f "$TRANSPARENCY/studio/$MODULE" ]]; then
    echo "BAN FAIL: missing transparency studio module: $MODULE"
    FAIL=1
  fi
done

for MODULE in useTransparencyStudio useStudioChapters StudioHeader ChapterRail ChapterPane; do
  if ! rg -q "studio/$MODULE'" "$STUDIO"; then
    echo "BAN FAIL: ProductTransparencyStudio must import extracted module: $MODULE"
    FAIL=1
  fi
done

if rg -n '\b(function|const|class) (DisclosureRowEditor|InventoryGroups|useTransparencyStudio|useStudioChapters|StudioHeader|ChapterRail|ChapterPane|OriginChapter|PlanetChapter|RightsChapter|indexFields)\b' \
  "$STUDIO" >/dev/null 2>&1; then
  echo "BAN FAIL: ProductTransparencyStudio must remain an orchestration shell"
  FAIL=1
fi

STUDIO_LINES="$(wc -l < "$STUDIO" | tr -d ' ')"
if (( STUDIO_LINES > 130 )); then
  echo "BAN FAIL: ProductTransparencyStudio grew past its 130-line orchestration budget ($STUDIO_LINES)"
  FAIL=1
fi

while IFS='|' read -r MODULE LIMIT; do
  MODULE_PATH="$TRANSPARENCY/studio/$MODULE"
  if [[ ! -f "$MODULE_PATH" ]]; then
    continue
  fi
  MODULE_LINES="$(wc -l < "$MODULE_PATH" | tr -d ' ')"
  if (( MODULE_LINES > LIMIT )); then
    echo "BAN FAIL: studio/$MODULE grew past its $LIMIT-line responsibility budget ($MODULE_LINES)"
    FAIL=1
  fi
done <<'EOF'
useTransparencyStudio.ts|525
DisclosureRowEditor.tsx|120
progress.ts|450
InventoryGroups.tsx|175
useStudioChapters.ts|170
StudioHeader.tsx|35
ChapterRail.tsx|80
ChapterPane.tsx|120
OriginChapter.tsx|70
PlanetChapter.tsx|75
RightsChapter.tsx|60
chapterProps.ts|25
disclosure/fields.tsx|45
disclosure/disclosureOptions.ts|45
disclosure/disclosureProps.ts|20
disclosure/SubjectField.tsx|45
disclosure/ValueField.tsx|105
disclosure/MethodFields.tsx|60
disclosure/ProvenanceSection.tsx|120
disclosure/StatusNote.tsx|30
disclosure/PublishFooter.tsx|45
EOF

if [[ "$FAIL" -ne 0 ]]; then
  echo "check-transparency-architecture-ban: FAILED"
  exit 1
fi

echo "check-transparency-architecture-ban: ok"
