
import { it, expect } from 'vitest'
import { createEmptyConceptDraft } from '../defaults'
import { evaluateFieldValidity } from '../validity'
import {
  MAX_CONCEPT_FIELD_SIZE, canAddCompetitor, canAddVariant, getConceptFieldSize,
  getRemainingFieldSlots, getRequiredCompetitorsRemaining, isFieldDeadEnd, competitorProgressLabel,
} from '../fieldSize'
import type { ConceptStudyDraft, StimulusMode } from '../types'

/**
 * Each assertion registers a real test. Conditions are evaluated eagerly, in
 * order, as the suite is collected — so state threaded between assertions
 * behaves exactly as it did when these ran as a script.
 */
const ok = (c: boolean, m: string, d?: unknown) => {
  const detail = d === undefined ? '' : ` — got ${JSON.stringify(d)}`
  it(m, () => {
    expect(c, `${m}${detail}`).toBe(true)
  })
}


function draft(mode: StimulusMode, own: number, comps: number, opts: { dupe?: boolean; unresolved?: number; noImage?: boolean } = {}): ConceptStudyDraft {
  const d = createEmptyConceptDraft()
  return {
    ...d,
    title: 'Test study',
    stimulusMode: mode,
    taxonomyNodeId: 1,
    pricePosture: 'blind',
    targetCompletions: 100,
    scoringRounds: 5,
    conceptArms: Array.from({ length: own }, (_, i) => ({
      localId: 'a' + i, display_name: 'Variant ' + i, frozen_price: null,
      arm_label: String.fromCharCode(65 + i),
      image_url: opts.noImage ? null : 'concept-stimuli/x' + i + '.png',
      image_filename: 'x.png', stimulus_payload: {},
    })),
    products: [
      ...Array.from({ length: comps }, (_, i) => ({
        localId: 'p' + i, product_id: (opts.dupe ? 900 : 100 + i) as unknown as number,
        frozen_display_name: 'Competitor ' + i, frozen_brand_name: 'Brand', frozen_image_url: null,
        frozen_price: null, battle_intent: 'direct_competitor' as const,
      })),
      ...Array.from({ length: opts.unresolved ?? 0 }, (_, i) => ({
        localId: 'u' + i, product_id: null, frozen_display_name: '', frozen_brand_name: '',
        frozen_image_url: null, frozen_price: null, battle_intent: 'direct_competitor' as const,
      })),
    ],
  } as ConceptStudyDraft
}
const sizeOk = (m: StimulusMode, o: number, c: number) => evaluateFieldValidity(draft(m, o, c)).fieldSizeOk
const compOk = (m: StimulusMode, o: number, c: number) => evaluateFieldValidity(draft(m, o, c)).competitorsOk
for (const [o, c, want] of [[1,5,true],[1,6,false],[2,4,true],[2,5,false],[3,3,true],[3,4,false],[4,2,true],[4,3,false]] as [number,number,boolean][]) {
  ok(sizeOk('package', o, c) === want, `${o} own + ${c} competitors = ${want ? 'allowed' : 'rejected'}`, getConceptFieldSize(draft('package',o,c)))
}
ok(compOk('package', 2, 0) === false, '2 own + 0 competitors = rejected')
ok(compOk('package', 2, 1) === false, '2 own + 1 competitor = rejected')
ok(compOk('package', 2, 2) === true,  '2 own + 2 competitors = allowed')
ok(compOk('price', 1, 0) === false, '1 own + 0 competitors = rejected')
ok(compOk('price', 1, 1) === true,  '1 own + 1 competitor = allowed')
ok(sizeOk('price', 1, 5) === true,  '1 own + 5 competitors = allowed')
ok(sizeOk('price', 1, 6) === false, '1 own + 6 competitors = rejected')
const A = (m: StimulusMode, o: number, c: number) => ({
  v: canAddVariant(draft(m, o, c)), k: canAddCompetitor(draft(m, o, c)),
})
let r = A('package', 3, 0)
ok(r.v.allowed && r.k.allowed, '3 own + 0 comp · both additions allowed')
r = A('package', 4, 0)
ok(!r.v.allowed && r.v.reason === 'reserved-for-competitors', '4 own + 0 comp · Add Variant disabled (reserved)', r.v.allowed ? null : r.v.message)
ok(r.k.allowed, '4 own + 0 comp · Add Competitor allowed')
r = A('package', 4, 1)
ok(!r.v.allowed && r.v.reason === 'reserved-for-competitors', '4 own + 1 comp · Add Variant disabled (reserved)', r.v.allowed ? null : r.v.message)
ok(r.k.allowed, '4 own + 1 comp · Add Competitor allowed')
r = A('package', 4, 2)
ok(!r.v.allowed && !r.k.allowed && r.v.reason === 'field-full', '4 own + 2 comp · both disabled (6/6)', r.v.allowed ? null : r.v.message)
r = A('package', 2, 4)
ok(!r.v.allowed && !r.k.allowed, '2 own + 4 comp · both disabled (6/6)')
r = A('price', 1, 4); ok(r.k.allowed, '1 own + 4 comp · Add Competitor allowed')
r = A('price', 1, 5); ok(!r.k.allowed && r.k.reason === 'field-full', '1 own + 5 comp · Add Competitor disabled')
ok(!canAddVariant(draft('price',1,1)).allowed, 'price · Add Variant never enabled')
ok(getRequiredCompetitorsRemaining(draft('package',3,0)) === 2, '3 own + 0 comp · 2 competitors still required')
ok(canAddVariant(draft('package',3,0)).allowed, '3 own + 0 comp · 4th variant fits (4+2=6)')
ok(!canAddVariant(draft('package',4,0)).allowed, '4 own + 0 comp · 5th variant would make 5+2=7')
ok(isFieldDeadEnd(draft('package',5,1)), '5 own + 1 comp · dead end detected')
ok(!isFieldDeadEnd(draft('package',4,2)), '4 own + 2 comp · not a dead end')
const over = evaluateFieldValidity(draft('package', 4, 3))
ok(over.fieldSize === 7 && over.fieldOverBy === 1, '7 seats detected', [over.fieldSize, over.fieldOverBy])
ok(!over.readyToPublish, 'over-limit draft cannot publish')
ok(over.outstanding.some(o => /Remove 1 item — the field holds 6/.test(o.message)), 'actionable over-limit blocker', over.outstanding.map(o=>o.message))
const over2 = evaluateFieldValidity(draft('package', 5, 3))
ok(over2.outstanding.some(o => /Remove 2 items/.test(o.message)), 'plural over-limit blocker')
const dead = evaluateFieldValidity(draft('package', 5, 1))
ok(!dead.readyToPublish, 'dead-end draft cannot publish')
ok(dead.outstanding.some(o => /Remove a variant to make room for 1 required competitor\./.test(o.message)), 'explains the resolution', dead.outstanding.map(o=>o.message))
const dup = evaluateFieldValidity(draft('package', 1, 2, { dupe: true }))
ok(!dup.duplicatesOk && !dup.readyToPublish, 'duplicate competitor blocks publish')
ok(dup.fieldSize === 3, 'duplicates still occupy seats', dup.fieldSize)
const un = evaluateFieldValidity(draft('package', 1, 2, { unresolved: 1 }))
ok(un.fieldSize === 4, 'unresolved persisted row occupies a seat', un.fieldSize)
ok(!un.intentsOk && !un.readyToPublish, 'unresolved row still blocks publish for identity')
ok(un.competitorsOk, 'unresolved row does not count toward the competitor minimum')
const noImg = evaluateFieldValidity(draft('package', 2, 2, { noImage: true }))
ok(noImg.outstanding.some(o => o.message === 'Upload pack image for Variant A'), 'per-variant image item', noImg.outstanding.map(o=>o.message))
const all = [dead, over, un, noImg, evaluateFieldValidity(draft('package',1,0))]
ok(!all.some(v => v.outstanding.some(o => /\barm\b/i.test(o.message))), 'no "arm" terminology in any blocker')
ok(!all.some(v => v.reasons.some(r => /at least two competitors/i.test(r))), 'the old "at least two competitors" message is gone')
const L = (m: StimulusMode, o: number, c: number) => competitorProgressLabel(draft(m, o, c))
ok(L('package',1,0) === 'Add at least 2 competitors', 'packaging 0', L('package',1,0))
ok(L('package',1,1) === '1 competitor added · 1 more required', 'packaging 1', L('package',1,1))
ok(L('package',1,2) === '2 competitors added', 'packaging 2', L('package',1,2))
ok(L('package',1,3) === '3 competitors added', 'packaging 3', L('package',1,3))
ok(L('package',5,1) === 'Make room for 1 required competitor', 'packaging dead end', L('package',5,1))
ok(L('price',1,0) === 'Add at least 1 competitor', 'price 0', L('price',1,0))
ok(L('price',1,1) === '1 competitor added', 'price 1', L('price',1,1))
ok(L('price',1,5) === '5 competitors added · field full', 'price at capacity', L('price',1,5))
ok(evaluateFieldValidity(draft('package',1,2)).fieldOk, 'valid packaging field publishes')
ok(evaluateFieldValidity(draft('price',1,1)).fieldOk, 'valid price field publishes')
ok(MAX_CONCEPT_FIELD_SIZE === 6, 'MAX_CONCEPT_FIELD_SIZE === 6')
ok(getRemainingFieldSlots(draft('package',1,2)) === 3, 'remaining slots', getRemainingFieldSlots(draft('package',1,2)))

/* Audit — blocker anchors must point at the field they describe. This one
   regressed once already: a stale copy of validity.ts sent the study-name
   blocker to Section 1 after Pass 2 moved the input into Setup. */
{
  const noTitle = { ...draft('package', 1, 2), title: '' }
  const titleItem = evaluateFieldValidity(noTitle).outstanding.find((o) =>
    /study a name/i.test(o.message)
  )
  ok(!!titleItem, 'the study-name blocker exists', titleItem?.message)
  ok(
    titleItem?.anchor === 'concept-study-name',
    'and anchors at the input, not the section it used to sit beside',
    titleItem?.anchor
  )
}
