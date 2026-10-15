import type {
  ConceptTestReport,
  ConceptTestVerdictResult,
} from '@/lib/conceptReport/conceptTestTypes'

export function pct(value: number | null | undefined): string {
  return value == null ? '—' : `${Math.round(value * 1000) / 10}%`
}

export function resultLabel(result: ConceptTestVerdictResult): string {
  switch (result) {
    case 'cleared':
      return 'Cleared'
    case 'not_cleared':
      return 'Did not clear'
    case 'too_close_to_call':
      return 'Too close'
    case 'not_enough_responses':
      return 'Still forming'
    default:
      return String(result).replace(/_/g, ' ')
  }
}

export function brandQuestionFinding(
  question: ConceptTestReport['brand_questions'][number],
): string {
  if (!question.options.length) return 'No answers are available yet.'
  const max = Math.max(...question.options.map((option) => option.n))
  const leaders = question.options.filter((option) => option.n === max)
  if (leaders.length === 1) {
    return `${leaders[0].option} led with ${max} of ${question.n} answers.`
  }
  return `${leaders.map((option) => option.option).join(', ')} tied at ${max} each.`
}
