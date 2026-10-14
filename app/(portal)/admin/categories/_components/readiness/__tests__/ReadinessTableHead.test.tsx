import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { ReadinessTableHead } from '../ReadinessTableHead'

describe('ReadinessTableHead', () => {
  it('marks the descending raters column and includes L1', () => {
    const html = renderToStaticMarkup(
      <ReadinessTableHead
        showL1
        nameHeader="L2"
        sortKey="raters"
        sortDir="desc"
        toggleSort={vi.fn()}
      />,
    )
    const l1 = html.indexOf('>L1<')
    const l2 = html.indexOf('>L2<')
    const raters = html.indexOf('>Raters ↓<')
    expect(l1).toBeGreaterThan(-1)
    expect(l2).toBeGreaterThan(l1)
    expect(raters).toBeGreaterThan(l2)
    expect(html).toContain('>Battles<')
    expect(html).toContain('>Products<')
    expect(html).not.toContain('>Battles ')
    expect(html).toContain('>7d / 30d<')
    expect(html).toContain('>Last battle<')
    expect(html).toContain('>Status<')
    expect(html.slice(Math.max(0, raters - 220), raters)).toContain(
      'background:var(--surface-1)',
    )
  })

  it('omits L1 and marks an ascending battles column', () => {
    const html = renderToStaticMarkup(
      <ReadinessTableHead
        showL1={false}
        nameHeader="L3"
        sortKey="battles"
        sortDir="asc"
        toggleSort={vi.fn()}
      />,
    )
    expect(html).not.toContain('>L1<')
    expect(html).toContain('>L3<')
    expect(html).toContain('>Battles ↑<')
    expect(html).toContain('>Raters<')
    expect(html).not.toContain('>Raters ')
  })
})
