import { describe, expect, it } from 'vitest'
import {
  chapterForMetric,
  composeDiligenceLine,
  composeFormulaLine,
  composeKeptLine,
  composeLaborLine,
  composeLivingLine,
  composeMadeLine,
  composePackLine,
  composePcfLine,
  composePlaceLine,
  composePlaceStory,
  composeRiskInputLine,
  composeSocialCertLine,
  composeSupplierLine,
  groupDisclosuresByChapter,
} from '@/lib/transparency/storyLines'

describe('storyLines', () => {
  it('maps metrics into P.R.O.O.F. chapters', () => {
    expect(chapterForMetric('product_footprint')).toBe('planet')
    expect(chapterForMetric('origin')).toBe('origin')
    expect(chapterForMetric('ingredients')).toBe('formula')
    expect(chapterForMetric('animal_welfare')).toBe('rights')
  })

  it('composes place, formula, ops, planet lines', () => {
    expect(
      composePlaceLine({ country: 'CL', region: 'Atacama', producer: 'Finca Norte' }),
    ).toBe('Chile · Atacama · Finca Norte')
    expect(
      composePlaceStory('cocoa', [
        { sub_metric_code: 'origin_country', value_text: 'GH', status: 'disclosed' },
      ]),
    ).toBe('Cocoa — Ghana')
    expect(composeFormulaLine({ subject: 'aspartame', percent: 0.5 })).toBe(
      'Aspartame · 0.5%',
    )
    expect(composeMadeLine('stone_ground', '48-hour ferment')).toBe(
      'Stone-ground · 48-hour ferment',
    )
    expect(composeKeptLine('refrigerated', 'best_by_quality', 'Use within 7 days')).toBe(
      'Refrigerated · Best by (quality) · Use within 7 days',
    )
    expect(
      composePcfLine({
        valueNum: 1.42,
        valueUnit: 'kgCO2e_per_kg',
        boundaryCode: 'cradle_to_gate',
        methodCode: 'ISO_14067',
        dataQuality: 'primary_data',
      }),
    ).toBe('1.42 kgCO₂e per kg — Cradle-to-gate, ISO 14067, Primary data')
    expect(
      composePackLine({
        component: 'bottle',
        material: 'PET1',
        disposal: 'curbside_recyclable',
        recycledPct: 30,
      }),
    ).toBe('Bottle · PET (#1) · Curbside recyclable · 30% recycled')
  })

  it('composes rights lines', () => {
    expect(
      composeLivingLine({
        welfare: 'Certified_Humane',
        antibiotics: 'no_antibiotics_ever',
      }),
    ).toBe('Certified Humane · No antibiotics ever')
    expect(
      composeLaborLine({ standard: 'SA8000', scope: 'tier_1_suppliers' }),
    ).toBe('SA8000 · Tier 1 suppliers')
    expect(composeSocialCertLine('Fairtrade')).toBe('Fairtrade')
    expect(
      composeDiligenceLine({
        step: 'identify_and_assess',
        geography: 'Extra diligence in cocoa origins',
      }),
    ).toBe('Identify and assess · Extra diligence in cocoa origins')
    expect(
      composeSupplierLine({ depth: 'farm_level', coveragePct: 80 }),
    ).toBe('Farm level · 80% covered')
    expect(
      composeRiskInputLine({
        ingredient: 'palm oil',
        standard: 'RSPO',
        custody: 'mass_balance',
      }),
    ).toBe('Palm oil · RSPO · Mass balance')
  })

  it('groups disclosures by chapter order', () => {
    const groups = groupDisclosuresByChapter([
      { metric_code: 'ingredients', id: 1 },
      { metric_code: 'product_footprint', id: 2 },
      { metric_code: 'origin', id: 3 },
      { metric_code: 'animal_welfare', id: 4 },
    ])
    expect(groups.map((g) => g.chapter.id)).toEqual([
      'planet',
      'rights',
      'origin',
      'formula',
    ])
  })
})
