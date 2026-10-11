import type { ConceptStudyDraft } from '@/lib/concept/types'
import type { PhonePreviewJourney } from '@/lib/concept/journey'
import {
  brandQuestionClosedLine,
  firstUnfinishedJourneyStep,
} from '@/lib/concept/journeyAccordion'

export function initialJourneyOpen(draft: ConceptStudyDraft): string | null {
  const step = firstUnfinishedJourneyStep(draft)
  if (step !== 'brand_questions') return step
  const pending = (draft.brandQuestions ?? []).find(
    (question) => brandQuestionClosedLine(question).kind !== 'question'
  )
  return pending ? `brand-${pending.localId}` : step
}

export function journeyLengthLabel(journey: PhonePreviewJourney | null): string | null {
  if (!journey) return null
  const { total_min, total_max } = journey.counts
  const screens =
    total_min === total_max
      ? `${total_min} ${total_min === 1 ? 'screen' : 'screens'}`
      : `${total_min}–${total_max} screens`
  // Conservative shopper estimate — the live preview minutes run low.
  return `${screens} · ~6 min`
}

export function fieldIssueLabel(code: string): string {
  switch (code) {
    case 'FIELD_TOO_SMALL':
      return 'Add more items to the field'
    case 'FIELD_TOO_LARGE':
      return 'Field is too large'
    case 'BENCHMARK_REQUIRED':
    case 'TOO_MANY_BENCHMARKS':
    case 'BENCHMARK_RETIRED':
      return 'This study type no longer uses a benchmark'
    case 'NOTHING_TO_TEST':
    case 'DESIGN_REQUIRED':
      return 'Add at least one design'
    case 'IMAGE_REQUIRED':
      return 'Every design and competitor needs an image.'
    default:
      return code
        .split('_')
        .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
        .join(' ')
  }
}
