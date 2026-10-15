import { describe, expect, it } from 'vitest'
import { createEmptyBoxDraft, createEmptyBoxFieldRow } from '../defaults'
import { normalizeStoredBoxDraft } from '../draftStore'
import { resolveBoxPublishError, sectionForBoxCode } from '../errors'
import {
  boxRiskNodeIds,
  boxRiskOutstanding,
  createEmptyRiskDeclaration,
  riskDeclarationToWire,
  riskFlagsLabel,
  sanitizeRiskDeclaration,
  summarizeTaxonomyRisk,
  type BoxRiskDeclarationDraft,
} from '../risk'
import type { BoxStudyDraft } from '../types'
import type { PrototypeListItem } from '@/lib/prototypes/types'

const answered: BoxRiskDeclarationDraft = {
  containsAlcohol: false,
  containsCaffeine: false,
  noProhibitedSubstances: true,
  alcoholShippingCompliant: false,
}

function prototypeSnapshot(taxonomyNodeId: number): PrototypeListItem {
  return {
    id: 'proto-1',
    brand_id: 42,
    name: 'Sample',
    internal_label: null,
    taxonomy_node_id: taxonomyNodeId,
    packaging: 'plain_sample',
    planned_price: null,
    image_paths: [],
    allergens_contains: [],
    allergens_may_contain: [],
    allergens_declared_at: null,
    allergens_declared_by: null,
    created_by: null,
    created_at: '2026-10-14T00:00:00Z',
    updated_at: '2026-10-14T00:00:00Z',
    archived_at: null,
    archived_by: null,
    readiness: 'ready',
    category_label: null,
  }
}

describe('sanitizeRiskDeclaration', () => {
  it('defaults missing or malformed input to unanswered', () => {
    expect(sanitizeRiskDeclaration(undefined)).toEqual(createEmptyRiskDeclaration())
    expect(sanitizeRiskDeclaration([])).toEqual(createEmptyRiskDeclaration())
    expect(
      sanitizeRiskDeclaration({
        containsAlcohol: 'yes',
        containsCaffeine: true,
        noProhibitedSubstances: 1,
        alcoholShippingCompliant: true,
      })
    ).toEqual({
      containsAlcohol: null,
      containsCaffeine: true,
      noProhibitedSubstances: false,
      alcoholShippingCompliant: true,
    })
  })

  it('gives drafts saved before A2 an unanswered declaration', () => {
    const legacy: Partial<BoxStudyDraft> = { ...createEmptyBoxDraft(42) }
    delete legacy.riskDeclaration
    expect(normalizeStoredBoxDraft(legacy, 42).riskDeclaration).toEqual(
      createEmptyRiskDeclaration()
    )
  })
})

describe('boxRiskNodeIds', () => {
  it('collects the box category and every seat category once', () => {
    const draft = createEmptyBoxDraft(42)
    draft.taxonomyNodeId = 10
    draft.fieldProducts = [
      { ...createEmptyBoxFieldRow(), product_id: 1, taxonomy_node_id: 10 },
      { ...createEmptyBoxFieldRow(), product_id: 2, taxonomy_node_id: 9220001 },
      {
        ...createEmptyBoxFieldRow(),
        kind: 'prototype',
        prototype_id: 'proto-1',
        taxonomy_node_id: null,
        prototypeSnapshot: prototypeSnapshot(9220209),
      },
    ]
    expect(boxRiskNodeIds(draft)).toEqual([10, 9220001, 9220209])
  })
})

describe('riskDeclarationToWire', () => {
  it('refuses an unanswered declaration', () => {
    expect(() => riskDeclarationToWire(createEmptyRiskDeclaration())).toThrow(
      'RISK_DECLARATION_REQUIRED'
    )
    expect(() =>
      riskDeclarationToWire({ ...answered, noProhibitedSubstances: false })
    ).toThrow('RISK_DECLARATION_REQUIRED')
  })

  it('requires the shipping attestation when the box contains alcohol', () => {
    expect(() =>
      riskDeclarationToWire({ ...answered, containsAlcohol: true })
    ).toThrow('ALCOHOL_SHIPPING_ATTESTATION_REQUIRED')
    expect(
      riskDeclarationToWire({
        ...answered,
        containsAlcohol: true,
        containsCaffeine: true,
        alcoholShippingCompliant: true,
      })
    ).toEqual({
      contains_alcohol: true,
      contains_caffeine: true,
      no_prohibited_substances: true,
      alcohol_shipping_compliant: true,
    })
  })

  it('omits the shipping attestation on a box without alcohol', () => {
    expect(
      riskDeclarationToWire({ ...answered, alcoholShippingCompliant: true })
    ).toEqual({
      contains_alcohol: false,
      contains_caffeine: false,
      no_prohibited_substances: true,
    })
  })
})

describe('boxRiskOutstanding', () => {
  it('is clear once everything is answered', () => {
    expect(boxRiskOutstanding(answered, summarizeTaxonomyRisk([]))).toEqual({
      blocking: [],
      soft: [],
    })
  })

  it('blocks restricted categories', () => {
    const risk = summarizeTaxonomyRisk([
      { nodeId: 10, risk: null },
      { nodeId: 9220209, risk: 'restricted' },
    ])
    expect(risk).toEqual({ status: 'ready', alcohol: false, restrictedNodeIds: [9220209] })
    expect(boxRiskOutstanding(answered, risk).blocking.join(' ')).toMatch(/can’t ship/)
  })

  it('needs the shipping attestation when taxonomy detects alcohol', () => {
    const risk = summarizeTaxonomyRisk([{ nodeId: 9220001, risk: 'alcohol' }])
    const out = boxRiskOutstanding(answered, risk)
    expect(out.blocking).toEqual([
      'Confirm you can legally ship alcohol with an adult signature.',
    ])
    expect(
      boxRiskOutstanding({ ...answered, alcoholShippingCompliant: true }, risk).blocking
    ).toEqual([])
  })

  it('lists every unanswered question', () => {
    const out = boxRiskOutstanding(createEmptyRiskDeclaration(), { status: 'idle' })
    expect(out.blocking).toHaveLength(3)
  })

  it('only warns when the category check is unavailable', () => {
    const out = boxRiskOutstanding(answered, { status: 'unavailable' })
    expect(out.blocking).toEqual([])
    expect(out.soft).toHaveLength(1)
  })
})

describe('risk refusals', () => {
  it.each([
    'RISK_DECLARATION_REQUIRED',
    'PROHIBITED_SUBSTANCE',
    'RESTRICTED_CATEGORY',
    'ALCOHOL_SHIPPING_ATTESTATION_REQUIRED',
    'ALCOHOL_MIN_AGE',
  ])('routes %s to the What’s in this box section with its own copy', (code) => {
    expect(sectionForBoxCode(code)).toBe('risk')
    const resolved = resolveBoxPublishError({ thrown: { message: 'x', hint: code } })
    expect(resolved.section).toBe('risk')
    expect(resolved.text).not.toMatch(/check the box is complete/i)
  })
})

describe('riskFlagsLabel', () => {
  it('labels alcohol and caffeine, and nothing otherwise', () => {
    expect(riskFlagsLabel(['alcohol'])).toBe('21+ · Contains alcohol')
    expect(riskFlagsLabel(['caffeine'])).toBe('Contains caffeine')
    expect(riskFlagsLabel([])).toBeNull()
  })
})
