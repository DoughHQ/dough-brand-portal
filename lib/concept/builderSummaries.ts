import { getConceptFieldSize } from './fieldSize'
import { uniquePairs } from './publish'
import { brandQuestionAnswerSource } from './singleTest'
import type { ConceptStudyDraft } from './types'

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`
}

/** Setup card — category, name, run shape. */
export function summarizeSetup(draft: ConceptStudyDraft): string {
  const category = draft.templateConfig.category_plural?.trim() || null
  const title = draft.title.trim() || null
  const n = Math.max(0, draft.targetCompletions)
  const run = `${plural(n, 'completion', 'completions')} · Runs until full`

  if (!category && !title) {
    return draft.taxonomyNodeId != null
      ? `Category set · ${run}`
      : `Choose a category · ${run}`
  }

  return [category, title, run].filter(Boolean).join(' · ')
}

/** Field card — seats and matchups. */
export function summarizeField(draft: ConceptStudyDraft): string {
  const designs = draft.conceptArms.length
  const competitors = draft.products.filter((p) => p.product_id != null).length
  const size = getConceptFieldSize(draft)
  if (size === 0) return 'Add designs and competitors'

  const battles = uniquePairs(size)
  return [
    `${plural(designs, 'design', 'designs')} + ${plural(competitors, 'competitor', 'competitors')}`,
    plural(battles, 'matchup', 'matchups'),
  ].join(' · ')
}

/** Questionnaire card — custom questions only (journey is fixed). */
export function summarizeQuestions(draft: ConceptStudyDraft): string {
  const questions = draft.brandQuestions ?? []
  if (questions.length === 0) return 'Standard journey · No custom questions'

  const fieldBound = questions.filter((q) => brandQuestionAnswerSource(q) === 'field').length
  const custom = questions.length - fieldBound
  const parts: string[] = [plural(questions.length, 'custom question', 'custom questions')]
  if (fieldBound > 0) parts.push(`${fieldBound} from field`)
  if (custom > 0 && fieldBound > 0) parts.push(`${custom} written`)
  return parts.join(' · ')
}

/** Sticky dock when the study can publish. */
export function summarizeDockReady(draft: ConceptStudyDraft): string {
  const size = getConceptFieldSize(draft)
  const battles = uniquePairs(size)
  const n = Math.max(0, draft.targetCompletions)
  return [
    `${size} in field`,
    plural(battles, 'matchup', 'matchups'),
    plural(n, 'completion', 'completions'),
    'Runs until full',
  ].join(' · ')
}
