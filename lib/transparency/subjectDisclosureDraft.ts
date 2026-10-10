import {
  blankDraft,
  type DisclosureDraft,
  type ProofSubMetricRow,
} from './disclosures'

type SubjectDisclosureDraftArgs = {
  field: ProofSubMetricRow
  subject: string
  current?: DisclosureDraft
  patch: Partial<DisclosureDraft>
}

export function subjectDisclosureDraft({
  field,
  subject,
  current,
  patch,
}: SubjectDisclosureDraftArgs): DisclosureDraft {
  const base =
    current ??
    blankDraft(field, {
      subjectKind: 'ingredient',
      subjectLabel: subject,
      status: 'disclosed',
    })

  return {
    ...base,
    subjectKind: 'ingredient',
    subjectLabel: subject,
    status: 'disclosed',
    ...patch,
  }
}
