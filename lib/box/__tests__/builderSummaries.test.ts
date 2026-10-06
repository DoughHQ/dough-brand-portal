import { describe, expect, it } from 'vitest'
import {
  summarizeBoxAudience,
  summarizeBoxBattle,
  summarizeBoxContents,
  summarizeBoxDockReady,
  summarizeBoxLogistics,
  summarizeBoxSetup,
} from '../builderSummaries'
import { createEmptyBoxDraft, createEmptyBoxFieldRow } from '../defaults'

function row(
  productId: number,
  name: string,
  opts?: { upc?: string; confirmed?: boolean; role?: 'yours' | 'competitor' }
) {
  return {
    ...createEmptyBoxFieldRow(),
    kind: 'product' as const,
    role: opts?.role ?? 'competitor',
    product_id: productId,
    frozen_display_name: name,
    frozen_brand_name: 'Brand',
    upc: opts?.upc ?? '012345678905',
    identityConfirmed: opts?.confirmed ?? true,
  }
}

describe('box builderSummaries', () => {
  it('summarizes setup with the purchased result and derived inventory', () => {
    const draft = {
      ...createEmptyBoxDraft(1),
      title: 'Gluten-free NYC',
      taxonomyNodeId: 9,
      targetCompletions: 50,
      physicalUnits: 55,
    }
    expect(summarizeBoxSetup(draft)).toBe(
      'Gluten-free NYC · 50 completions · Prepare 55 boxes'
    )
  })

  it('prompts for a category when the title is set', () => {
    const draft = { ...createEmptyBoxDraft(1), title: 'Discovery box' }
    expect(summarizeBoxSetup(draft)).toBe('Discovery box · Choose a category')
  })

  it('summarizes contents and matchups', () => {
    const empty = createEmptyBoxDraft(1)
    expect(summarizeBoxContents(empty)).toBe('Add seats to the field')

    const draft = {
      ...empty,
      fieldProducts: [
        row(1, 'A', { role: 'yours' }),
        row(2, 'B'),
        row(3, 'C'),
      ],
    }
    expect(summarizeBoxContents(draft)).toBe(
      '3 seats · 3 matchups · prices incomplete'
    )

    const priced = {
      ...draft,
      fieldProducts: draft.fieldProducts.map((r) => ({ ...r, price: 3.49 })),
    }
    expect(summarizeBoxContents(priced)).toBe(
      '3 seats · 3 matchups · prices ready'
    )
  })

  it('summarizes the locked Dough method', () => {
    const empty = createEmptyBoxDraft(1)
    expect(summarizeBoxBattle(empty)).toContain('Battles + taste')
    expect(summarizeBoxBattle(empty)).toContain('No brand Qs')
    expect(
      summarizeBoxBattle({
        ...empty,
        day2LiveWithIt: true,
        ihutBrandQuestions: [
          {
            localId: '1',
            prompt: 'Would you recommend this?',
            options: ['Yes', 'No'],
            max_select: 1,
          },
        ],
      })
    ).toContain('Day 2 on')
  })

  it('summarizes open vs restricted audience', () => {
    const empty = createEmptyBoxDraft(1)
    expect(summarizeBoxAudience(empty)).toBe('Open to everyone')
    expect(
      summarizeBoxAudience({
        ...empty,
        eligibilityTier: 'tried',
        eligibility: {
          ...empty.eligibility,
          targetStates: ['NY', 'NJ'],
        },
      })
    ).toBe('Must have tried hero · 2 states')
  })

  it('summarizes logistics and the ready dock line', () => {
    const draft = {
      ...createEmptyBoxDraft(1),
      targetCompletions: 50,
      physicalUnits: 55,
      fieldProducts: [row(1, 'A', { role: 'yours' }), row(2, 'B')],
    }
    expect(summarizeBoxLogistics(draft)).toBe(
      '50 completions · 55 boxes prepared · Runs until full'
    )
    expect(summarizeBoxDockReady(draft)).toBe(
      '2 in box · 1 matchup · prices incomplete · 50 completions · Prepare 55 boxes'
    )
    const pricedDock = {
      ...draft,
      fieldProducts: draft.fieldProducts.map((r) => ({ ...r, price: 2.99 })),
    }
    expect(summarizeBoxDockReady(pricedDock)).toBe(
      '2 in box · 1 matchup · prices ready · 50 completions · Prepare 55 boxes'
    )
  })
})
