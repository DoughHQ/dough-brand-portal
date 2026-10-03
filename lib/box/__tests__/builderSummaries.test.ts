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
  opts?: { upc?: string; confirmed?: boolean }
) {
  return {
    ...createEmptyBoxFieldRow(),
    product_id: productId,
    frozen_display_name: name,
    frozen_brand_name: 'Brand',
    upc: opts?.upc ?? '012345678905',
    identityConfirmed: opts?.confirmed ?? true,
  }
}

describe('box builderSummaries', () => {
  it('summarizes setup with title and hero', () => {
    const draft = {
      ...createEmptyBoxDraft(1),
      title: 'Gluten-free NYC',
      taxonomyNodeId: 9,
      focalProductId: 10,
      fieldProducts: [row(10, 'Seed Cracker')],
    }
    expect(summarizeBoxSetup(draft)).toBe('Gluten-free NYC · Seed Cracker')
  })

  it('prompts for a hero when the title is set', () => {
    const draft = { ...createEmptyBoxDraft(1), title: 'Discovery box' }
    expect(summarizeBoxSetup(draft)).toBe('Discovery box · Choose a hero product')
  })

  it('summarizes contents and matchups', () => {
    const empty = createEmptyBoxDraft(1)
    expect(summarizeBoxContents(empty)).toBe('Add products to the box')

    const draft = {
      ...empty,
      fieldProducts: [row(1, 'A'), row(2, 'B'), row(3, 'C')],
    }
    expect(summarizeBoxContents(draft)).toBe('3 products · 3 matchups')
  })

  it('summarizes battle prompt default vs custom', () => {
    const empty = createEmptyBoxDraft(1)
    expect(summarizeBoxBattle(empty)).toContain('Dough default')
    expect(summarizeBoxBattle(empty)).toContain('Which would you buy?')
    expect(
      summarizeBoxBattle({ ...empty, battleQuestion: 'Which tastes better?' })
    ).toBe('Your prompt · “Which tastes better?”')
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
      physicalUnits: 50,
      abandonWindowDays: 14,
      expiresAt: '2026-12-15T12:00:00.000Z',
      fieldProducts: [row(1, 'A'), row(2, 'B')],
    }
    expect(summarizeBoxLogistics(draft)).toMatch(/^50 boxes · 14d abandon · Ends /)
    expect(summarizeBoxDockReady(draft)).toBe('2 in box · 1 matchup · 50 boxes')
  })
})
