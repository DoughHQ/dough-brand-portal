import { describe, expect, it } from 'vitest'
import {
  chapterForMetric,
  composeFormulaLine,
  composeKeptLine,
  composeMadeLine,
  composePackLine,
  composePcfLine,
  composePlaceLine,
  composePlaceStory,
  groupDisclosuresByChapter,
} from '@/lib/transparency/storyLines'

describe('storyLines', () => {
  it('maps metrics into P.R.O.O.F. chapters', () => {
    expect(chapterForMetric('product_footprint')).toBe('planet')
    expect(chapterForMetric('origin')).toBe('origin')
    expect(chapterForMetric('ingredients')).toBe('formula')
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

  it('groups disclosures by chapter order', () => {
    const groups = groupDisclosuresByChapter([
      { metric_code: 'ingredients', id: 1 },
      { metric_code: 'product_footprint', id: 2 },
      { metric_code: 'origin', id: 3 },
    ])
    expect(groups.map((g) => g.chapter.id)).toEqual(['planet', 'origin', 'formula'])
  })
})
