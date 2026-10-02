import { getConceptFieldSize } from './fieldSize'
import { uniquePairs } from './publish'
import type { ConceptStudyDraft } from './types'

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`
}

/** Setup card — study name and run shape (category lives in the open form). */
export function summarizeSetup(draft: ConceptStudyDraft): string {
  const title = draft.title.trim() || null
  const n = Math.max(0, draft.targetCompletions)
  const run = `${plural(n, 'completion', 'completions')} · Runs until full`

  if (!title) {
    return draft.taxonomyNodeId != null
      ? `Name your study · ${run}`
      : `Choose a category · ${run}`
  }

  return `${title} · ${run}`
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
