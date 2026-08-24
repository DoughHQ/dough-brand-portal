import { describe, expect, it } from 'vitest'
import type { ConceptStudyDraft } from '../../types'
import { createEmptyConceptDraft } from '../../defaults'
import { combatantsFromDraft } from '../combatants'
import { applyBattleWin, emptyWinTally, mostChosenCombatantRef } from '../sessionWins'
import { sampleReportFromDraft } from '../sampleReport'
import type { PreviewCombatant } from '../combatants'

function arm(i: number, image: string | null) {
  return {
    localId: `a${i}`,
    display_name: `Concept ${i}`,
    frozen_price: '4.99',
    arm_label: String.fromCharCode(65 + i),
    image_url: image,
    image_filename: 'x.png',
    stimulus_payload: {},
  }
}

function product(i: number, image: string | null) {
  return {
    localId: `p${i}`,
    product_id: 100 + i,
    frozen_display_name: `Brand ${i}`,
    frozen_brand_name: `Brand ${i}`,
    frozen_image_url: image,
    frozen_price: '3.99',
    market_reference_price: '3.99',
    battle_intent: 'competitor' as const,
    upc: `02840000${1000 + i}`,
  }
}

function draft(
  mode: ConceptStudyDraft['stimulusMode'],
  extras: Partial<ConceptStudyDraft> = {}
): ConceptStudyDraft {
  const d = createEmptyConceptDraft()
  return {
    ...d,
    draftId: 'draft-sample-seed',
    title: 'Oat milk latte',
    stimulusMode: mode,
    pricePosture: 'realistic',
    conceptArms: [
      arm(0, 'https://cdn.example/concept-0.png'),
      arm(1, 'https://cdn.example/concept-1.png'),
    ],
    products: [product(0, 'https://cdn.example/brand-0.jpg')],
    eligibility: {
      ...d.eligibility,
      qualifyingNodeLabel: 'Oat milk',
    },
    ...extras,
  }
}

function signedFrom(d: ConceptStudyDraft): PreviewCombatant[] {
  return combatantsFromDraft(d).map((c) => ({
    ...c,
    image_url: c.image_url?.startsWith('https://') ? c.image_url : null,
    image_unavailable: !c.image_url?.startsWith('https://'),
  }))
}

describe('sampleReportFromDraft', () => {
  it('prefixes the title with SAMPLE', () => {
    const d = draft('package')
    const report = sampleReportFromDraft(d, signedFrom(d))
    expect(report.study_title?.startsWith('SAMPLE')).toBe(true)
    expect(report.study_title).toContain('Oat milk latte')
  })

  it('is simulated and not thin', () => {
    const d = draft('package')
    const report = sampleReportFromDraft(d, signedFrom(d))
    expect(report.is_simulated).toBe(true)
    expect(report.finding.is_thin).toBe(false)
  })

  it('keeps the fixture “not a forecast” note', () => {
    const d = draft('package')
    const report = sampleReportFromDraft(d, signedFrom(d))
    expect(report.finding.note).toMatch(/not a forecast/i)
  })

  it('uses draft combatant names and signed images', () => {
    const d = draft('package')
    const signed = signedFrom(d)
    const report = sampleReportFromDraft(d, signed)
    const names = report.win_rate_field.map((r) => r.display_name).sort()
    expect(names).toEqual(['Brand 0', 'Concept 0', 'Concept 1'])
    expect(report.n_concepts).toBe(2)
    expect(report.n_products).toBe(1)
    for (const row of report.win_rate_field) {
      expect(row.image_url).toMatch(/^https:\/\//)
      expect(row.image_url).not.toMatch(/concept-stimuli\//)
    }
  })

  it('strips raw storage refs from image_url', () => {
    const d = draft('package', {
      conceptArms: [arm(0, 'concept-stimuli/12/draft/C.png')],
      products: [product(0, 'https://cdn.example/ok.jpg')],
    })
    const signed: PreviewCombatant[] = [
      {
        ref: 1,
        kind: 'concept',
        name: 'Concept 0',
        brand: null,
        image_url: 'concept-stimuli/12/draft/C.png',
        price: 4.99,
      },
      {
        ref: 2,
        kind: 'product',
        name: 'Brand 0',
        brand: 'Brand 0',
        image_url: 'https://cdn.example/ok.jpg',
        price: 3.99,
      },
    ]
    const report = sampleReportFromDraft(d, signed)
    const concept = report.win_rate_field.find((r) => r.kind === 'concept')
    const productRow = report.win_rate_field.find((r) => r.kind === 'product')
    expect(concept?.image_url).toBeNull()
    expect(productRow?.image_url).toBe('https://cdn.example/ok.jpg')
  })

  it('omits concept_wtp on package studies', () => {
    const d = draft('package')
    const report = sampleReportFromDraft(d, signedFrom(d))
    expect(
      report.question_responses.some((q) => q.question_type_code === 'concept_wtp')
    ).toBe(false)
  })

  it('includes WTP for concept arms only on price studies', () => {
    const d = draft('price')
    const report = sampleReportFromDraft(d, signedFrom(d))
    const wtp = report.question_responses.find(
      (q) => q.question_type_code === 'concept_wtp'
    )
    expect(wtp).toBeTruthy()
    const refs = (wtp?.aggregate.wtp_by_arm ?? []).map((a) => a.combatant_ref)
    expect(refs.sort()).toEqual([1, 2])
    expect(wtp?.aggregate.wtp_by_arm?.every((a) => a.display_name?.startsWith('Concept'))).toBe(
      true
    )
  })

  it('does not change ranks when a product won every walkthrough battle', () => {
    const d = draft('package')
    const signed = signedFrom(d)
    const productRef = signed.find((c) => c.kind === 'product')!.ref
    const conceptRefs = signed.filter((c) => c.kind === 'concept').map((c) => c.ref)

    let tally = emptyWinTally()
    for (const ref of conceptRefs) {
      tally = applyBattleWin(tally, 'B_WIN', ref, productRef)
      tally = applyBattleWin(tally, 'B_WIN', ref, productRef)
      tally = applyBattleWin(tally, 'B_WIN', ref, productRef)
    }
    expect(mostChosenCombatantRef(tally)).toBe(productRef)

    const before = sampleReportFromDraft(d, signed)
    const after = sampleReportFromDraft(d, signed)
    expect(mostChosenCombatantRef(tally)).toBe(productRef)
    expect(after.win_rate_field.map((r) => r.combatant_ref)).toEqual(
      before.win_rate_field.map((r) => r.combatant_ref)
    )
    expect(after.win_rate_field.map((r) => r.rank)).toEqual(
      before.win_rate_field.map((r) => r.rank)
    )
    expect(before.win_rate_field.find((r) => r.combatant_ref === productRef)?.rank).toBe(
      after.win_rate_field.find((r) => r.combatant_ref === productRef)?.rank
    )
  })

  it('is deterministic for a given draftId', () => {
    const d = draft('package')
    const a = sampleReportFromDraft(d, signedFrom(d))
    const b = sampleReportFromDraft(d, signedFrom(d))
    expect(a.win_rate_field).toEqual(b.win_rate_field)
  })
})
