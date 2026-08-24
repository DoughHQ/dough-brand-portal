import type { ConceptStudyDraft } from '@/lib/concept/types'
import { isDisplayableImageUrl } from '@/lib/concept/stimuliStorage'
import { conceptReportFixture } from '@/lib/conceptReport/fixture'
import type {
  ConceptMissionReport,
  DecisionFrame,
  FindingCombatant,
  QuestionResponse,
  WinRateFieldRow,
  WtpArm,
  WtpArmReport,
} from '@/lib/conceptReport/types'
import type { PreviewCombatant } from './combatants'

/** Fixture note — kept verbatim so the sample still says “not a forecast.” */
const NOT_A_FORECAST_NOTE =
  'These results report what respondents chose in this head-to-head test. They are not a forecast of sales or a recommendation to launch.'

/** Live-data thread — secondary only. Watermark + header carry “illustrative.” */
const LIVE_DATA_LINE =
  'A live report uses this same format, with numbers from real respondents after the study runs.'

function hashSeed(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function seededShuffle<T>(items: T[], seed: string): T[] {
  const rng = mulberry32(hashSeed(`sample-rank:${seed}`))
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const tmp = out[i]!
    out[i] = out[j]!
    out[j] = tmp
  }
  return out
}

function displayImage(url: string | null | undefined): string | null {
  return isDisplayableImageUrl(url) ? url!.trim() : null
}

function heroRef(
  draft: ConceptStudyDraft,
  field: PreviewCombatant[]
): number | null {
  const name = draft.conceptArms[0]?.display_name.trim()
  if (name) {
    const match = field.find((c) => c.kind === 'concept' && c.name === name)
    if (match) return match.ref
  }
  return field.find((c) => c.kind === 'concept')?.ref ?? null
}

function battleIntent(c: PreviewCombatant, hero: number | null): string {
  if (c.kind === 'product') return 'direct_competitor'
  if (hero != null && c.ref === hero) return 'hero'
  return 'own_concept_arm'
}

/** Wide gaps — no near-tie. Seed only shuffles who sits where, never a win tally. */
function ladderRates(n: number): number[] {
  const base = [64, 51, 38, 27, 18, 12]
  const rates: number[] = []
  for (let i = 0; i < n; i++) {
    rates.push(base[i] ?? Math.max(8, 12 - (i - 5) * 3))
  }
  return rates
}

function ordinal(n: number): string {
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`
  switch (n % 10) {
    case 1:
      return `${n}st`
    case 2:
      return `${n}nd`
    case 3:
      return `${n}rd`
    default:
      return `${n}th`
  }
}

function placeLine(rank: number, fieldSize: number): string {
  return `your concept placed ${ordinal(rank)} of ${fieldSize}`
}

function decisionForRanking(
  top: WinRateFieldRow,
  hero: WinRateFieldRow | undefined,
  fieldSize: number
): DecisionFrame {
  const rate = top.win_rate_of_100
  let action = `Advance ${top.display_name}`
  if (hero) {
    const place = placeLine(hero.rank, fieldSize)
    action =
      hero.rank === 1
        ? `Advance ${top.display_name} — ${place}`
        : `${top.display_name} leads this field — ${place}`
  }

  const heroAside =
    hero && hero.combatant_ref !== top.combatant_ref
      ? `${hero.display_name} — your concept — is ${ordinal(hero.rank)} of ${fieldSize}.`
      : null

  return {
    posture: top.kind === 'product' ? 'products_lead' : 'concept_ahead',
    action,
    rationale: [
      `${top.display_name} wins ${rate != null ? Math.round(rate) : '—'} of 100 head-to-heads here.`,
      heroAside,
      LIVE_DATA_LINE,
    ]
      .filter(Boolean)
      .join(' '),
    headline_kind: 'confident',
  }
}

function sampleWtpReport(): WtpArmReport {
  return {
    n_answers: 16,
    n_priced: 13,
    n_reject: 3,
    rejection_rate: 0.1875,
    below_reporting_floor: false,
    reporting_floor: 8,
    modal_band: { label: '$3.50–$3.99', low: 3.5, high: 3.99 },
    band_distribution: [
      { band_id: 'b1', label: '$2.50–$2.99', low: 2.5, high: 2.99, count: 2 },
      { band_id: 'b2', label: '$3.00–$3.49', low: 3, high: 3.49, count: 4 },
      { band_id: 'b3', label: '$3.50–$3.99', low: 3.5, high: 3.99, count: 5 },
      { band_id: 'b4', label: '$4.00–$4.49', low: 4, high: 4.49, count: 2 },
    ],
    demand_curve: [
      { price: 2.5, share_would_pay_gte: 0.81 },
      { price: 3.0, share_would_pay_gte: 0.69 },
      { price: 3.5, share_would_pay_gte: 0.44 },
      { price: 4.0, share_would_pay_gte: 0.13 },
    ],
    presentation_rule: 'SAMPLE — illustrative demand. Not measured.',
    cap_note: null,
    suppression_note: null,
    note: 'SAMPLE — illustrative data. Not from respondents.',
  }
}

function wtpQuestion(conceptCombatants: PreviewCombatant[]): QuestionResponse {
  const arms: WtpArm[] = conceptCombatants.map((c) => ({
    combatant_ref: c.ref,
    display_name: c.name,
    report: sampleWtpReport(),
  }))
  return {
    question_type_code: 'concept_wtp',
    display_name: 'Willingness to pay',
    prompt: 'How much would you pay?',
    session_number: 1,
    position: 3,
    signal_kind: 'per_arm_reservation_price',
    framing_note: 'SAMPLE — illustrative reservation prices. Not measured.',
    aggregate: {
      n_answers: 16,
      distribution: {},
      shares: {},
      wtp_signal: 'per_arm_reservation_price',
      wtp_by_arm: arms,
      wtp_overall: sampleWtpReport(),
      wtp_interpretation:
        'SAMPLE — illustrative demand curve. These numbers show the format. They are not from respondents.',
    },
  }
}

function toFinding(row: WinRateFieldRow): FindingCombatant {
  return {
    combatant_ref: row.combatant_ref,
    display_name: row.display_name,
    kind: row.kind,
    battle_intent: row.battle_intent,
    win_rate_of_100: row.win_rate_of_100,
  }
}

/**
 * Real report shape, their field, invented ranks.
 * Walkthrough clicks / win tallies are never an input — ranks come only
 * from a draftId seed so a product that “won every battle” cannot move.
 */
export function sampleReportFromDraft(
  draft: ConceptStudyDraft,
  signedCombatants: PreviewCombatant[]
): ConceptMissionReport {
  const base = conceptReportFixture(`sample-${draft.draftId}`)
  const field = signedCombatants.filter(
    (c) => c.kind === 'concept' || c.kind === 'product'
  )
  const hero = heroRef(draft, field)
  const ordered = seededShuffle(field, draft.draftId)
  const rates = ladderRates(ordered.length)

  const win_rate_field: WinRateFieldRow[] = ordered.map((c, i) => {
    const rate = rates[i] ?? 30
    return {
      combatant_ref: c.ref,
      display_name: c.name,
      battle_intent: battleIntent(c, hero),
      kind: c.kind === 'product' ? 'product' : 'concept',
      rank: i + 1,
      placeable: true,
      win_rate_of_100: rate,
      win_rate_lo: Math.max(8, rate - 5),
      win_rate_hi: Math.min(92, rate + 5),
      frozen_price: c.price,
      image_url: displayImage(c.image_url),
    }
  })

  const n_concepts = field.filter((c) => c.kind === 'concept').length
  const n_products = field.filter((c) => c.kind === 'product').length
  const top = win_rate_field[0]
  const heroRow = hero != null
    ? win_rate_field.find((r) => r.combatant_ref === hero)
    : undefined
  const title = draft.title.trim() || 'Concept study'
  const category =
    draft.eligibility.qualifyingNodeLabel?.trim() ||
    draft.templateConfig.category_plural?.trim() ||
    base.category_label
  const pricesShown = draft.pricePosture !== 'blind'

  const decision_frame: DecisionFrame = top
    ? decisionForRanking(top, heroRow, win_rate_field.length)
    : {
        posture: 'concept_ahead',
        action: 'Advance the leading concept',
        rationale: LIVE_DATA_LINE,
        headline_kind: 'confident',
      }

  const relationship =
    top?.kind === 'product'
      ? 'products_lead_concepts'
      : !win_rate_field.some((r) => r.kind === 'product')
        ? 'concept_leads_field'
        : heroRow?.rank === 1
          ? 'concept_leads_field'
          : 'concept_ahead_of_some_products'

  const questions = base.question_responses
    .filter((q) => q.question_type_code !== 'concept_wtp')
    .map((q) => {
      if (q.question_type_code !== 'concept_screener') return q
      const label = category ?? 'this category'
      return {
        ...q,
        prompt: `How often do you buy ${label.toLowerCase()}?`,
      }
    })

  const conceptCombatants = field.filter((c) => c.kind === 'concept')
  const question_responses =
    draft.stimulusMode === 'price'
      ? [...questions, wtpQuestion(conceptCombatants)]
      : questions

  return {
    ...base,
    id: `sample-report-${draft.draftId}`,
    mission_id: `sample-${draft.draftId}`,
    study_title: `SAMPLE · ${title}`,
    category_label: category,
    price_posture_label: pricesShown ? 'Prices shown' : 'Prices hidden',
    prices_shown: pricesShown,
    n_concepts,
    n_products,
    n_combatants: field.length,
    n_decisive_battles: Math.max(
      24,
      field.length * Math.max(0, field.length - 1) * 8
    ),
    win_rate_field,
    finding: {
      top: top ? toFinding(top) : base.finding.top,
      relationship_to_field: relationship,
      is_tie: false,
      is_thin: false,
      tie_with: null,
      suggested_additional_respondents: null,
      note: NOT_A_FORECAST_NOTE,
      decision_frame,
    },
    decision_frame,
    top_pair_record: top
      ? {
          display_name: top.display_name,
          kind: top.kind,
          battle_intent: top.battle_intent,
          combatant_ref: top.combatant_ref,
          vs: win_rate_field.slice(1).map((opp, i) => ({
            opponent_ref: opp.combatant_ref,
            opponent_name: opp.display_name,
            opponent_kind: opp.kind,
            opponent_intent: opp.battle_intent,
            top_wins: 18 - i,
            opponent_wins: 4 + i,
            shown: 22,
          })),
        }
      : null,
    question_responses,
    min_cluster_warning: '',
    is_simulated: true,
  }
}
