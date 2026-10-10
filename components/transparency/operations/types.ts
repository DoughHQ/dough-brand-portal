import type {
  DisclosureDraft,
  ProofSubMetricRow,
} from '@/lib/transparency/disclosures'

export type OpsLocalRow = {
  key: string
  draft: DisclosureDraft
  saved: DisclosureDraft | null
}

export type LabelLine = {
  name: string
  display: string
  fromLabel: boolean
}

export type OperationsEditorHandlers = {
  onChange: (subMetricCode: string, key: string, draft: DisclosureDraft) => void
  onEnsureRow: (field: ProofSubMetricRow, subjectLabel: string) => string
  onSaveRow: (field: ProofSubMetricRow, row: OpsLocalRow) => void
}
