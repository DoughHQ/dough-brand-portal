import { describe, expect, it } from 'vitest'
import { applyBattleWin, emptyWinTally, mostChosenCombatantRef } from '../sessionWins'
import { buildRecap } from '../recap'
import {
  pickAssignedConceptRef,
  resolveFocalSubject,
  subjectIndexFromCombatants,
} from '../resolveFocalSubject'
import type { ConceptPlanSubject } from '../planTypes'

const conceptA: ConceptPlanSubject = {
  ref: 1,
  kind: 'concept',
  name: 'Concept A',
  brand: null,
  image_url: null,
  price: null,
}
const conceptB: ConceptPlanSubject = {
  ref: 2,
  kind: 'concept',
  name: 'Concept B',
  brand: null,
  image_url: null,
  price: null,
}
const product: ConceptPlanSubject = {
  ref: 3,
  kind: 'product',
  name: 'PB Blondie Bestie Sundae',
  brand: "Ben & Jerry's",
  image_url: null,
  price: null,
}

const byRef = subjectIndexFromCombatants([conceptA, conceptB, product])
const conceptRefs = [1, 2]

describe('pickAssignedConceptRef', () => {
  it('returns null when there are no concept refs', () => {
    expect(pickAssignedConceptRef([], 'draft-seed-fixed')).toBeNull()
  })

  it('returns the only concept ref', () => {
    expect(pickAssignedConceptRef([4], 'any')).toBe(4)
  })

  it('is deterministic for a seed and never a product ref', () => {
    const a = pickAssignedConceptRef(conceptRefs, 'draft-seed-fixed')
    const b = pickAssignedConceptRef(conceptRefs, 'draft-seed-fixed')
    expect(a).toBe(b)
    expect(conceptRefs).toContain(a)
    expect(a).not.toBe(3)
  })

  it('sorts refs before hashing so insertion order does not matter', () => {
    expect(pickAssignedConceptRef([2, 1], 'draft-seed-fixed')).toBe(
      pickAssignedConceptRef([1, 2], 'draft-seed-fixed')
    )
  })
})

describe('resolveFocalSubject', () => {
  it('assigned stays a concept even when a product won every battle', () => {
    let tally = emptyWinTally()
    tally = applyBattleWin(tally, 'A_WIN', 3, 1)
    tally = applyBattleWin(tally, 'A_WIN', 3, 2)
    expect(mostChosenCombatantRef(tally)).toBe(3)

    const subject = resolveFocalSubject({
      screen: {
        focal_arm: 'assigned',
        subject: conceptA,
        subject_ref: 1,
      },
      tally,
      byRef,
      conceptRefs,
      seed: 'draft-seed-fixed',
    })
    expect(subject?.ref).toBe(1)
    expect(subject?.kind).toBe('concept')
  })

  it('respondent_winner is the product when the product won the most battles', () => {
    let tally = emptyWinTally()
    tally = applyBattleWin(tally, 'A_WIN', 3, 1)
    tally = applyBattleWin(tally, 'A_WIN', 3, 2)
    tally = applyBattleWin(tally, 'B_WIN', 1, 2)

    const subject = resolveFocalSubject({
      screen: {
        focal_arm: 'respondent_winner',
        resolve_subject: 'client_session_winner',
        subject: null,
        subject_ref: null,
      },
      tally,
      byRef,
      conceptRefs,
      seed: 'draft-seed-fixed',
    })
    expect(subject?.ref).toBe(3)
    expect(subject?.kind).toBe('product')
    expect(subject?.name).toBe('PB Blondie Bestie Sundae')
  })

  it('recap still names the product the operator clicked most', () => {
    let tally = emptyWinTally()
    tally = applyBattleWin(tally, 'A_WIN', 3, 1)
    tally = applyBattleWin(tally, 'A_WIN', 3, 2)
    const mostChosen = mostChosenCombatantRef(tally)
    expect(mostChosen).toBe(3)
    const recap = buildRecap({
      battleWins: tally,
      battleTotal: 2,
      mostChosen,
      subjects: new Map([
        [1, { ref: 1, name: 'Concept A', kind: 'concept' }],
        [2, { ref: 2, name: 'Concept B', kind: 'concept' }],
        [3, { ref: 3, name: 'PB Blondie Bestie Sundae', kind: 'product' }],
      ]),
      answers: [],
    })
    expect(recap.battles?.headline).toMatch(/PB Blondie Bestie Sundae/)
    expect(recap.battles?.headline).toMatch(/2 of 2/)
    expect(recap.battles?.subject?.kind).toBe('product')
  })

  it('respondent_winner is null when every battle was abstained', () => {
    let tally = emptyWinTally()
    tally = applyBattleWin(tally, 'NEITHER', 1, 3)
    tally = applyBattleWin(tally, 'SKIP', 2, 3)
    const subject = resolveFocalSubject({
      screen: {
        focal_arm: 'respondent_winner',
        resolve_subject: 'client_session_winner',
        subject: null,
      },
      tally,
      byRef,
      conceptRefs,
      seed: 'draft-seed-fixed',
    })
    expect(subject).toBeNull()
  })

  it('assigned falls back to the seeded concept when subject was not baked', () => {
    const ref = pickAssignedConceptRef(conceptRefs, 'draft-seed-fixed')
    const subject = resolveFocalSubject({
      screen: { focal_arm: 'assigned', subject: null, subject_ref: null },
      tally: emptyWinTally(),
      byRef,
      conceptRefs,
      seed: 'draft-seed-fixed',
    })
    expect(subject?.ref).toBe(ref)
    expect(subject?.kind).toBe('concept')
  })
})
