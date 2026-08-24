import { describe, expect, it } from 'vitest'
import { applyBattleWin, emptyWinTally, mostChosenCombatantRef } from '../sessionWins'
import { buildRecap } from '../recap'
import { humanRecapTitle, looksLikeRawKey } from '../recapLabels'

describe('humanRecapTitle', () => {
  it('maps known labels and never returns snake_case', () => {
    expect(
      humanRecapTitle({ label: 'category_frequency', prompt: 'How often?' })
    ).toBe('How often you buy this category')
    expect(humanRecapTitle({ label: 'choice_driver' })).toBe('Why you picked it')
    expect(looksLikeRawKey(humanRecapTitle({ label: 'category_frequency' }))).toBe(
      false
    )
  })

  it('uses the prompt when the label is unknown', () => {
    expect(
      humanRecapTitle({ label: 'custom_slot', prompt: 'Would you take this home?' })
    ).toBe('Would you take this home?')
  })

  it('humanizes an unknown key when there is no prompt', () => {
    expect(humanRecapTitle({ label: 'shelf_notice' })).toBe('Shelf notice')
    expect(looksLikeRawKey(humanRecapTitle({ label: 'shelf_notice' }))).toBe(false)
  })
})

describe('buildRecap', () => {
  const subjects = new Map([
    [
      1,
      {
        ref: 1,
        name: 'Package C',
        kind: 'concept',
        image_url: 'https://signed.example/c.png',
      },
    ],
    [
      3,
      {
        ref: 3,
        name: 'PB Blondie Bestie Sundae',
        kind: 'product',
        image_url: 'https://cdn.example/sundae.jpg',
      },
    ],
  ])

  it('names a product in Your battles when the product won most', () => {
    let tally = emptyWinTally()
    tally = applyBattleWin(tally, 'A_WIN', 3, 1)
    tally = applyBattleWin(tally, 'A_WIN', 3, 1)
    const recap = buildRecap({
      battleWins: tally,
      battleTotal: 2,
      mostChosen: mostChosenCombatantRef(tally),
      subjects,
      answers: [],
    })
    expect(recap.battles?.subject?.name).toBe('PB Blondie Bestie Sundae')
    expect(recap.battles?.subject?.kind).toBe('product')
    expect(recap.battles?.headline).toMatch(/PB Blondie Bestie Sundae/)
    expect(recap.battles?.headline).toMatch(/2 of 2/)
  })

  it('does not fabricate a battle portrait when every round was abstained', () => {
    let tally = emptyWinTally()
    tally = applyBattleWin(tally, 'NEITHER', 1, 3)
    tally = applyBattleWin(tally, 'SKIP', 1, 3)
    const recap = buildRecap({
      battleWins: tally,
      battleTotal: 2,
      mostChosen: mostChosenCombatantRef(tally),
      subjects,
      answers: [],
    })
    expect(recap.battles?.subject).toBeNull()
    expect(recap.battles?.headline).toMatch(/no clear pick/i)
  })

  it('groups screeners, followups, and reactions by subject', () => {
    const recap = buildRecap({
      battleWins: new Map(),
      battleTotal: 0,
      mostChosen: null,
      subjects,
      answers: [
        { kind: 'screener', title: 'How often you buy this category', values: ['Weekly'] },
        {
          kind: 'followup',
          title: 'Why this one',
          values: ['Packaging'],
          subject: subjects.get(3),
        },
        {
          kind: 'reaction',
          title: 'Why you picked it',
          values: ['The colors'],
          subject: subjects.get(3),
        },
        {
          kind: 'reaction',
          title: 'What this looks like',
          values: ['Ice cream'],
          subject: subjects.get(1),
        },
      ],
    })
    expect(recap.aboutYou).toHaveLength(1)
    expect(recap.alongTheWay[0]?.subject?.kind).toBe('product')
    expect(recap.reactions).toHaveLength(2)
    const productGroup = recap.reactions.find((g) => g.subject?.ref === 3)
    const conceptGroup = recap.reactions.find((g) => g.subject?.ref === 1)
    expect(productGroup?.answers).toHaveLength(1)
    expect(conceptGroup?.answers[0]?.title).toBe('What this looks like')
    expect(recap.isEmpty).toBe(false)
  })

  it('marks a walkthrough with no clicks as empty', () => {
    const recap = buildRecap({
      battleWins: new Map(),
      battleTotal: 0,
      mostChosen: null,
      subjects,
      answers: [],
    })
    expect(recap.isEmpty).toBe(true)
    expect(recap.battles).toBeNull()
  })
})
