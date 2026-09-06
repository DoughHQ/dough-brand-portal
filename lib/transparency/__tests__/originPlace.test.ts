import { describe, expect, it } from 'vitest'
import { composePlaceLine } from '@/lib/transparency/storyLines'

describe('composePlaceLine', () => {
  it('joins country, region, and producer', () => {
    expect(
      composePlaceLine({
        country: 'CL',
        region: 'Atacama',
        producer: 'Finca Norte',
      }),
    ).toBe('Chile · Atacama · Finca Norte')
  })

  it('skips empty depth', () => {
    expect(composePlaceLine({ country: 'US' })).toBe('United States')
  })
})
