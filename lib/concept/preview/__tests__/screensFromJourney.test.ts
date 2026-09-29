import { describe, expect, it } from 'vitest'
import { mapJourneyForPhonePreview, parseConceptJourney } from '@/lib/concept/journey'
import journeyFixture from '../../../../concept-core-fixtures/journey.json'
import type { PreviewCombatant } from '../combatants'
import { screensFromJourney } from '../screensFromJourney'
import { isBattleScreen } from '../planTypes'

const combatants: PreviewCombatant[] = [
  {
    ref: 1,
    kind: 'concept',
    name: 'New design',
    brand: 'Secret Brand',
    image_url:
      'https://rzovknemrvpioidkaqrk.supabase.co/storage/v1/object/public/concept-images/fixture/new-design.png',
    price: 5.99,
  },
  {
    ref: 2,
    kind: 'concept',
    name: 'Current pack',
    brand: 'Secret Brand',
    image_url:
      'https://rzovknemrvpioidkaqrk.supabase.co/storage/v1/object/public/concept-images/fixture/current-pack.png',
    price: 6.49,
  },
]

describe('screensFromJourney', () => {
  const parsed = parseConceptJourney(journeyFixture)
  if (!parsed) throw new Error('fixture journey did not parse')
  const journey = mapJourneyForPhonePreview(parsed, [
    { display_name: 'New design', arm_label: 'New design' },
    { display_name: 'Current pack', arm_label: 'Current pack' },
  ])

  it('walks battles, why-this-one, and a closing summary without brand names', () => {
    const { screens, combatants: labeled } = screensFromJourney({
      journey,
      combatants,
      seed: 'fixture',
      stimulusMode: 'package',
    })

    expect(labeled.map((c) => c.name)).toEqual(['Design A', 'Design B'])
    expect(labeled.every((c) => c.brand == null)).toBe(true)

    const battles = screens.filter(isBattleScreen)
    expect(battles).toHaveLength(3)
    expect(battles[0]?.prompt).toBe('Which one would you buy?')
    expect(battles.every((b) => b.config?.suppress_name === true)).toBe(true)

    const whys = screens.filter((s) => s.kind === 'attribute_followup')
    expect(whys).toHaveLength(3)
    expect(whys.map((s) => (s.kind === 'attribute_followup' ? s.linked_round_number : 0))).toEqual(
      battles.map((b) => b.round_number)
    )

    expect(screens[0]?.kind).toBe('screener')
    expect(screens.at(-1)?.kind).toBe('session_summary')
    expect(
      screens.filter((s) => 'question_type' in s && s.question_type === 'maxdiff')
    ).toHaveLength(7)
    const firstLook = screens.find((s) => 'question_type' in s && s.question_type === 'rating')
    expect(firstLook && 'subject' in firstLook ? firstLook.subject?.name : null).toBe('Design A')

    const blob = JSON.stringify(screens)
    expect(blob).not.toContain('New design')
    expect(blob).not.toContain('Current pack')
    expect(blob).not.toContain('Secret Brand')
  })

})
