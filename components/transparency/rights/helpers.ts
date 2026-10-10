import type {
  DisclosureDraft,
  ProofSubMetricRow,
} from '@/lib/transparency/disclosures'
import type { RightsChangeHandler, RightsLocalRow } from './types'

export function wholeRow(
  rows: RightsLocalRow[] | undefined,
): RightsLocalRow | undefined {
  return rows?.[0]
}

export function disclosedText(row: RightsLocalRow | undefined): string | null {
  if (!row || row.draft.status !== 'disclosed') return null
  return row.draft.valueText
}

export function disclosedNum(row: RightsLocalRow | undefined): number | null {
  if (!row || row.draft.status !== 'disclosed') return null
  return row.draft.valueNum
}

export function patchShared(
  rows: Array<{ field: ProofSubMetricRow; row: RightsLocalRow } | null | undefined>,
  patch: Partial<DisclosureDraft>,
  onChange: RightsChangeHandler,
) {
  for (const item of rows) {
    if (!item) continue
    onChange(item.field.sub_metric_code, item.row.key, {
      ...item.row.draft,
      ...patch,
      status: 'disclosed',
    })
  }
}
