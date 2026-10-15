import type { DisclosureDraft, ProofSubMetricRow } from '@/lib/transparency/disclosures'

export type Props = {
  field: ProofSubMetricRow
  draft: DisclosureDraft
  canEdit: boolean
  saving: boolean
  error: string | null
  onChange: (next: DisclosureDraft) => void
  onSave: () => void
}
