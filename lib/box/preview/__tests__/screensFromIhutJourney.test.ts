import { describe, expect, it } from 'vitest'
import {
  combatantsFromBoxDraft,
  ihutJourneyLengthLabel,
  normalizeIhutPreviewJourney,
  parseIhutPreviewJourney,
  screensFromIhutJourney,
} from '../screensFromIhutJourney'
import { createEmptyBoxDraft, createEmptyBoxFieldRow } from '../../defaults'

describe('IHUT preview walkthrough mapping', () => {
  it('parses preview_ihut_journey and expands dual tracks + per-product', () => {
    const raw = {
      screens: [
        { kind: 'shelf_battles', count: 3, prompt: 'Which would you pick up?' },
        {
          kind: 'expectation',
          prompt: 'How good do you expect it to taste?',
          options: ['Amazing', 'Good'],
          per_product: true,
        },
        { kind: 'taste_battles', count: 3, prompt: 'Which did you enjoy more?' },
        {
          kind: 'why_followups',
          up_to: 1,
          prompt: 'What made the difference?',
          options: ['Taste'],
        },
        {
          kind: 'buy_order',
          prompt: "Put them in the order you'd buy them",
          items: 3,
        },
        { kind: 'summary', session: 1 },
      ],
      counts: { total_min: 6, total_max: 7, seats: 3 },
      field_issues: [],
      note: 'Shelf before taste',
    }
    const journey = parseIhutPreviewJourney(raw)
    expect(journey?.note).toBe('Shelf before taste')

    const draft = createEmptyBoxDraft(1)
    draft.fieldProducts = [1, 2, 3].map((n) => ({
      ...createEmptyBoxFieldRow(),
      kind: 'product' as const,
      role: n === 1 ? ('yours' as const) : ('competitor' as const),
      product_id: n,
      upc: `00000000000${n}`,
      frozen_display_name: `Product ${n}`,
      identityConfirmed: true,
      allergensConfirmed: true,
      allergensContains: [],
      allergensMayContain: [],
    }))
    const combatants = combatantsFromBoxDraft(draft)
    expect(combatants).toHaveLength(3)

    const normalized = normalizeIhutPreviewJourney(journey!, combatants)
    expect(normalized.screens.filter((s) => s.kind === 'battles')).toHaveLength(2)
    expect(normalized.screens.filter((s) => s.kind === 'expectation')).toHaveLength(3)
    expect(normalized.screens.some((s) => s.kind === 'rank')).toBe(true)

    const walked = screensFromIhutJourney({
      journey: journey!,
      combatants,
      seed: 'test',
    })
    expect(
      walked.screens.some(
        (s) => s.kind === 'forced_choice_battle' || s.kind === 'concept_battle'
      )
    ).toBe(true)
    expect(walked.screens.length).toBeGreaterThan(8)
  })

  it('formats Questions chrome length like concept (screens · minutes)', () => {
    expect(ihutJourneyLengthLabel(null)).toBeNull()
    expect(
      ihutJourneyLengthLabel({
        screens: [],
        counts: { total_min: 24, total_max: 26 },
        field_issues: [],
        estimated_minutes: { min: 18.4, max: 21.2 },
      })
    ).toBe('24–26 screens · ~18–21 min')
    expect(
      ihutJourneyLengthLabel({
        screens: [],
        counts: { total_min: 12, total_max: 12 },
        field_issues: [],
        estimated_minutes: { min: 20, max: 20 },
      })
    ).toBe('12 screens · ~20 min')
    expect(
      ihutJourneyLengthLabel({
        screens: [],
        counts: { total_min: 10, total_max: 10 },
        field_issues: [],
      })
    ).toBe('10 screens · ~20 min')
  })
})
