import { describe, expect, it } from 'vitest'
import { createEmptyConceptDraft, newConceptArm, newProductCompetitor } from '../defaults'
import { buildMastheadModel, summarizeMasthead } from '../studyMasthead'

describe('studyMasthead', () => {
  it('summarizes an empty field with run shape only', () => {
    const draft = {
      ...createEmptyConceptDraft(),
      stimulusMode: 'package' as const,
      targetCompletions: 500,
    }
    expect(summarizeMasthead(draft)).toBe('500 completions · Runs until full')
  })

  it('starts empty with design + competitor starters (not a fixed 4+1 cast)', () => {
    const draft = {
      ...createEmptyConceptDraft(),
      stimulusMode: 'package' as const,
      taxonomyNodeId: 1,
      targetCompletions: 500,
    }
    const model = buildMastheadModel(draft)
    expect(model.empty).toBe(true)
    expect(model.showVs).toBe(false)
    expect(model.addDesign?.action).toBe('add-design')
    expect(model.addCompetitor?.action).toBe('add-competitor')
    expect(model.helper).toMatch(/field shows up/i)
  })

  it('shows vs only when both sides exist', () => {
    const draft = {
      ...createEmptyConceptDraft(),
      stimulusMode: 'package' as const,
      conceptArms: [newConceptArm(0), newConceptArm(1)],
      products: [
        {
          ...newProductCompetitor(),
          product_id: 9 as unknown as number,
          frozen_display_name: 'North Creamery',
          frozen_brand_name: 'North',
        },
      ],
      targetCompletions: 500,
    }
    const model = buildMastheadModel(draft)
    expect(model.showVs).toBe(true)
    expect(model.arms).toHaveLength(2)
    expect(model.products).toHaveLength(1)
    expect(model.meta).toContain('2 designs · 1 competitor')
    expect(model.meta).toContain('500 completions')
  })

  it('offers a competitor seat when designs exist but the shelf has no rival', () => {
    const draft = {
      ...createEmptyConceptDraft(),
      stimulusMode: 'package' as const,
      conceptArms: [newConceptArm(0)],
      products: [],
      targetCompletions: 100,
    }
    const model = buildMastheadModel(draft)
    expect(model.showVs).toBe(false)
    expect(model.addCompetitor?.action).toBe('add-competitor')
  })

  it('uses design letters as names when the arm is unnamed', () => {
    const draft = {
      ...createEmptyConceptDraft(),
      conceptArms: [newConceptArm(0)],
    }
    const model = buildMastheadModel(draft)
    const arm = model.arms[0]
    expect(arm?.kind).toBe('arm')
    if (arm?.kind !== 'arm') return
    expect(arm.name).toBe('Design A')
    expect(arm.letter).toBe('A')
  })
})
