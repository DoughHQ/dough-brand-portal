import type {
  DisclosureDraft,
  ProofSubMetricRow,
} from '@/lib/transparency/disclosures'

export type RightsLocalRow = {
  key: string
  draft: DisclosureDraft
  saved: DisclosureDraft | null
}

export type RightsChangeHandler = (
  subMetricCode: string,
  key: string,
  draft: DisclosureDraft,
) => void

export type RightsSheetProps = {
  fieldsByCode: Record<string, ProofSubMetricRow | undefined>
  rowsByCode: Record<string, RightsLocalRow[]>
  canEdit: boolean
  savingKey: string | null
  storyError: string | null
  errors: Record<string, string>
  onChange: RightsChangeHandler
  onSaveRow: (field: ProofSubMetricRow, row: RightsLocalRow) => void
  onSaveBundle: (codes: readonly string[], bundleKey: string) => void
  onClearStoryError?: () => void
}
