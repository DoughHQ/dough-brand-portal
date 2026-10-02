import { describe, expect, it } from 'vitest'
import {
  summarizeDockReady,
  summarizeField,
  summarizeSetup,
} from '../builderSummaries'
import { createEmptyConceptDraft, newConceptArm, newProductCompetitor } from '../defaults'

describe('builderSummaries', () => {
  it('summarizes setup with title and run-until-full (no category)', () => {
    const draft = {
      ...createEmptyConceptDraft(),
      taxonomyNodeId: 1,
      title: 'Midnight Cocoa',
      templateConfig: {
        ...createEmptyConceptDraft().templateConfig,
        category_plural: 'ice cream',
      },
      targetCompletions: 100,
      fieldingDays: null,
    }
    expect(summarizeSetup(draft)).toBe(
      'Midnight Cocoa · 100 completions · Runs until full'
    )
  })

  it('prompts for a name when category is set but title is empty', () => {
    const draft = {
      ...createEmptyConceptDraft(),
      taxonomyNodeId: 1,
      title: '',
      targetCompletions: 100,
    }
    expect(summarizeSetup(draft)).toBe(
      'Name your study · 100 completions · Runs until full'
    )
  })

  it('summarizes an empty field', () => {
    expect(summarizeField(createEmptyConceptDraft())).toBe('Add designs and competitors')
  })

  it('summarizes field seats and matchups', () => {
    const draft = {
      ...createEmptyConceptDraft(),
      conceptArms: [newConceptArm(0), newConceptArm(1), newConceptArm(2)],
      products: [
        { ...newProductCompetitor(), product_id: 1 as unknown as number, frozen_display_name: 'A' },
        { ...newProductCompetitor(), product_id: 2 as unknown as number, frozen_display_name: 'B' },
      ],
    }
    expect(summarizeField(draft)).toBe('3 designs + 2 competitors · 10 matchups')
  })

  it('summarizes the ready dock line', () => {
    const draft = {
      ...createEmptyConceptDraft(),
      conceptArms: [newConceptArm(0), newConceptArm(1)],
      products: [
        { ...newProductCompetitor(), product_id: 1 as unknown as number },
      ],
      targetCompletions: 50,
    }
    expect(summarizeDockReady(draft)).toBe(
      '3 in field · 3 matchups · 50 completions · Runs until full'
    )
  })
})
