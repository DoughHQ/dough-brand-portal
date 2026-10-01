export type StudyOrderStatus = 'awaiting_payment' | 'paid' | 'waived'

export function isStudyOrderStatus(value: unknown): value is StudyOrderStatus {
  return value === 'awaiting_payment' || value === 'paid' || value === 'waived'
}

export function isConceptStudy(row: {
  test_type?: string | null
  mission_type?: string | null
}): boolean {
  return row.test_type === 'concept' || row.mission_type === 'concept_test'
}

export function checkoutHref(missionId: string): string {
  return `/studies/${missionId}/checkout`
}

export type ConceptListStatus = {
  label: string
  href: string | null
}

/**
 * Concept studies show the order, not the list's in_review label.
 * Other study types return null so their existing badge stays.
 * A concept study with no order is "Not live" — it is not in Dough review.
 */
export function conceptListStatus(row: {
  mission_id: string
  test_type?: string | null
  mission_type?: string | null
  lifecycle_state: string
  order_status?: StudyOrderStatus | null
}): ConceptListStatus | null {
  if (!isConceptStudy(row)) return null
  if (
    row.lifecycle_state === 'completed' ||
    row.lifecycle_state === 'expired' ||
    row.lifecycle_state === 'archived'
  ) {
    return null
  }
  if (row.order_status === 'awaiting_payment') {
    return { label: 'Awaiting payment', href: checkoutHref(row.mission_id) }
  }
  if (row.lifecycle_state === 'in_review') {
    if (row.order_status === 'paid' || row.order_status === 'waived') {
      return { label: 'Live', href: null }
    }
    return { label: 'Not live', href: null }
  }
  return null
}
