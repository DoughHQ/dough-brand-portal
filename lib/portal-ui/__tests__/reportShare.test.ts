import { describe, expect, it } from 'vitest'
import {
  buildShareLinkMessage,
  buildShareText,
  reportPrintTitle,
} from '../reportShare'

describe('reportShare', () => {
  it('builds a forwardable finding memo', () => {
    const text = buildShareText({
      productName: 'Organic Garlic',
      finding: 'Organic Garlic cleared the taste bar (62%).',
      implication: 'Run a priced IHUT before any list-price call.',
      snapshotLabel: 'Oct 7, 2026',
      url: 'https://portal.example/reports/abc',
    })
    expect(text).toContain('cleared the taste bar')
    expect(text).toContain('priced IHUT')
    expect(text).toContain('Snapshot · Oct 7, 2026')
    expect(text).toContain('https://portal.example/reports/abc')
  })

  it('prefers finding + link for quick share', () => {
    expect(
      buildShareLinkMessage({
        productName: 'Keel',
        finding: 'Too close to call on buy-at-price.',
        url: 'https://x.test/r/1',
      }),
    ).toBe('Too close to call on buy-at-price.\n\nhttps://x.test/r/1')
  })

  it('names the print document', () => {
    expect(
      reportPrintTitle({ productName: 'Keel Lemon Water', snapshotLabel: 'Oct 7' }),
    ).toBe('Keel Lemon Water · Dough decision report · Oct 7')
  })
})
