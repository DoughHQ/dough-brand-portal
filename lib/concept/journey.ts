/**
 * preview_concept_journey shape + outline mapper.
 * Journey subject.display_name / arm_label are brand-facing only —
 * the outline must show Design A/B (same rule as the server).
 */

import {
  isBrandFacingDesignLabel,
  respondentLabelForArm,
} from './designLetters'

export type JourneySubject = {
  arm_label?: string | null
  display_name?: string | null
  image_url?: string | null
}

export type JourneyScreen = {
  kind: string
  prompt?: string
  options?: unknown
  subject?: JourneySubject
  count?: number
  up_to?: number
  sets?: number
  items?: unknown
  items_per_set?: number
  bands?: unknown
  max_select?: number
  needs_review?: boolean
  prompt_source?: string
  optional?: boolean
  note?: string
}

export type ConceptJourney = {
  note?: string
  counts: {
    total_min: number
    total_max: number
    screeners?: number
    first_look?: number
    battles?: number
    why_followups_up_to?: number
    maxdiff_sets?: number
    rank?: number
    price?: number
    brand_questions?: number
    open_text?: number
  }
  screens: JourneyScreen[]
  field_issues: string[]
  needs_review: boolean
  estimated_minutes?: { min: number; max: number }
}

/** Phone-mock subject: image + respondent letter, never brand labels. */
export type PhonePreviewSubject = {
  image_url: string | null
  /** Always "Design A" / "Design B" / … */
  respondent_label: string
}

export type PhonePreviewScreen = Omit<JourneyScreen, 'subject'> & {
  subject?: PhonePreviewSubject
}

export type PhonePreviewJourney = Omit<ConceptJourney, 'screens'> & {
  screens: PhonePreviewScreen[]
}

type ConceptArmRef = { arm_label?: string; display_name?: string }

/**
 * Map a journey for the Section 2 phone mock.
 * Replaces brand-facing subject labels with Design letters from concept order.
 */
export function mapJourneyForPhonePreview(
  journey: ConceptJourney,
  concepts: ReadonlyArray<ConceptArmRef>
): PhonePreviewJourney {
  return {
    ...journey,
    screens: journey.screens.map((screen) => {
      if (!screen.subject) return { ...screen, subject: undefined }
      const respondent_label = respondentLabelForArm(concepts, screen.subject)
      return {
        ...screen,
        subject: {
          image_url: screen.subject.image_url?.trim() || null,
          respondent_label,
        },
      }
    }),
  }
}

/** Fail closed: any brand-facing subject label left in the mock is a bug. */
export function phonePreviewLeaksBrandLabels(
  preview: PhonePreviewJourney
): string[] {
  const leaks: string[] = []
  for (const screen of preview.screens) {
    const label = screen.subject?.respondent_label?.trim()
    if (!label) continue
    if (isBrandFacingDesignLabel(label) && !/^Design\s+/i.test(label)) {
      leaks.push(label)
    }
    // Explicit fixture brand names
    if (/new design|current pack/i.test(label)) {
      leaks.push(label)
    }
  }
  return leaks
}

export function parseConceptJourney(data: unknown): ConceptJourney | null {
  if (data == null || typeof data !== 'object' || Array.isArray(data)) return null
  const row = data as Record<string, unknown>
  if (!Array.isArray(row.screens) || row.counts == null || typeof row.counts !== 'object') {
    return null
  }
  const counts = row.counts as Record<string, unknown>
  return {
    note: typeof row.note === 'string' ? row.note : undefined,
    counts: {
      total_min: Number(counts.total_min) || 0,
      total_max: Number(counts.total_max) || 0,
      screeners: numberOrUndef(counts.screeners),
      first_look: numberOrUndef(counts.first_look),
      battles: numberOrUndef(counts.battles),
      why_followups_up_to: numberOrUndef(counts.why_followups_up_to),
      maxdiff_sets: numberOrUndef(counts.maxdiff_sets),
      rank: numberOrUndef(counts.rank),
      price: numberOrUndef(counts.price),
      brand_questions: numberOrUndef(counts.brand_questions),
      open_text: numberOrUndef(counts.open_text),
    },
    screens: row.screens as JourneyScreen[],
    field_issues: Array.isArray(row.field_issues)
      ? row.field_issues.filter((x): x is string => typeof x === 'string')
      : [],
    needs_review: row.needs_review === true,
    estimated_minutes:
      row.estimated_minutes != null && typeof row.estimated_minutes === 'object'
        ? {
            min: Number((row.estimated_minutes as Record<string, unknown>).min) || 0,
            max: Number((row.estimated_minutes as Record<string, unknown>).max) || 0,
          }
        : undefined,
  }
}

function numberOrUndef(v: unknown): number | undefined {
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined
}

/** Human labels — same vocabulary as Section 2 journey cards. */
export function phonePreviewScreenLabel(kind: string): string {
  switch (kind) {
    case 'screener':
      return 'Screeners'
    case 'rating':
      return 'First look'
    case 'battles':
      return 'Battles'
    case 'why_followups':
      return 'Why follow-up'
    case 'maxdiff':
      return 'What matters'
    case 'rank':
      return 'Rank the field'
    case 'price':
      return 'Price'
    case 'brand_question':
      return 'Your questions'
    case 'open_text':
      return 'Open text'
    case 'summary':
      return 'Summary'
    default:
      return kind
        .split('_')
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
  }
}

export type PhonePreviewOwnership = 'Dough method' | 'Yours to write'

export function phonePreviewOwnership(kind: string): PhonePreviewOwnership {
  switch (kind) {
    case 'screener':
    case 'battles':
    case 'price':
    case 'brand_question':
      return 'Yours to write'
    default:
      return 'Dough method'
  }
}

export type PhonePreviewStage = {
  id: string
  title: string
  screens: Array<PhonePreviewScreen & { index: number }>
}

/** Collapse consecutive screens that share a journey-card stage. */
export function groupPhonePreviewScreens(
  screens: ReadonlyArray<PhonePreviewScreen>
): PhonePreviewStage[] {
  const stageIdFor = (kind: string): string => {
    switch (kind) {
      case 'screener':
        return 'screeners'
      case 'rating':
        return 'first_look'
      case 'battles':
      case 'why_followups':
        return 'battles'
      case 'maxdiff':
        return 'what_matters'
      case 'rank':
        return 'rank'
      case 'price':
        return 'price'
      case 'brand_question':
        return 'brand_questions'
      case 'open_text':
        return 'open_text'
      case 'summary':
        return 'summary'
      default:
        return kind
    }
  }

  const stageTitle: Record<string, string> = {
    screeners: 'Screeners',
    first_look: 'First look',
    battles: 'Battles',
    what_matters: 'What matters',
    rank: 'Rank the field',
    price: 'Price',
    brand_questions: 'Your questions',
    open_text: 'Open text',
    summary: 'Summary',
  }

  const groups: PhonePreviewStage[] = []
  for (let i = 0; i < screens.length; i++) {
    const screen = screens[i]!
    const id = stageIdFor(screen.kind)
    const last = groups[groups.length - 1]
    const entry = { ...screen, index: i + 1 }
    if (last && last.id === id) {
      last.screens.push(entry)
    } else {
      groups.push({
        id,
        title: stageTitle[id] ?? phonePreviewScreenLabel(screen.kind),
        screens: [entry],
      })
    }
  }
  return groups
}

