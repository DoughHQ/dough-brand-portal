import { type DisclosureDraft, type ProofSubMetricRow } from '@/lib/transparency/disclosures'

export type FormulaLocalRow = {
  key: string
  draft: DisclosureDraft
  saved: DisclosureDraft | null
}

export type Props = {
  ingredientStatement: string | null
  pctField: ProofSubMetricRow | null
  breakoutField: ProofSubMetricRow | null
  pctRows: FormulaLocalRow[]
  breakoutRows: FormulaLocalRow[]
  canEdit: boolean
  savingKey: string | null
  errors: Record<string, string>
  onChange: (subMetricCode: string, key: string, draft: DisclosureDraft) => void
  onSave: (field: ProofSubMetricRow, row: FormulaLocalRow) => void
  onEnsureRow: (field: ProofSubMetricRow, subjectLabel: string) => string
  onAddCustomIngredient: (name: string) => void
}

export function norm(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function findRow(rows: FormulaLocalRow[], subject: string): FormulaLocalRow | undefined {
  const n = norm(subject)
  return rows.find((r) => norm(r.draft.subjectLabel ?? '') === n)
}

export type IngredientLine = {
  name: string
  display: string
  fromLabel: boolean
}
