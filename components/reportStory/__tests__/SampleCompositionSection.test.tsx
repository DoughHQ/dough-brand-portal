import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { SampleCompositionSection } from '../SampleCompositionSection'
import type { SampleComposition } from '@/lib/reportSampleComposition'

const composition: SampleComposition = {
  version: 1,
  cohort: 'completers',
  n_in_cohort: 12,
  n_with_age: 11,
  n_missing_age: 1,
  k_floor: 5,
  age_bands: [
    { key: '25-34', n: 7, share: 7 / 11, reportable: true, withheld_reason: null },
    {
      key: '18-24',
      n: 4,
      share: null,
      reportable: false,
      withheld_reason: 'below_k_anonymity_floor',
    },
  ],
  brand_familiarity: [
    {
      key: 'existing_purchaser',
      n: 8,
      share: 2 / 3,
      reportable: true,
      withheld_reason: null,
    },
  ],
  definitions: {},
}

describe('SampleCompositionSection', () => {
  it('renders reportable shares and withholds small-cell percentages', () => {
    const html = renderToStaticMarkup(
      createElement(SampleCompositionSection, { composition, number: '06' }),
    )

    expect(html).toContain('Who took part')
    expect(html).toContain('63.6% · n=7')
    expect(html).toContain('Withheld (n &lt; 5)')
    expect(html).toContain('Already bought or used')
    expect(html).not.toContain('below_k_anonymity_floor')
  })

  it('renders nothing for older reports without composition', () => {
    expect(
      renderToStaticMarkup(
        createElement(SampleCompositionSection, { composition: null, number: '06' }),
      ),
    ).toBe('')
  })
})
