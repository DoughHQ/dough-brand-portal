import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { ReadinessSearch } from '../ReadinessSearch'
import { ReadinessSortBar } from '../ReadinessSortBar'
import { ReadinessStatusStrip } from '../ReadinessStatusStrip'

describe('readiness table chrome', () => {
  it('counts each status in order', () => {
    const html = renderToStaticMarkup(
      <ReadinessStatusStrip
        statusCounts={{ sellable: 2, approaching: 5, building: 8, empty: 1 }}
      />,
    )
    const sellable = html.indexOf('>Sellable<')
    const approaching = html.indexOf('>Approaching<')
    const building = html.indexOf('>Building<')
    const empty = html.indexOf('>Empty<')
    expect(sellable).toBeGreaterThan(-1)
    expect(approaching).toBeGreaterThan(sellable)
    expect(building).toBeGreaterThan(approaching)
    expect(empty).toBeGreaterThan(building)
    expect(html).toContain('color:var(--sage, #3E6B4A)')
    expect(html).toContain('>2<')
    expect(html).toContain('>5<')
    expect(html).toContain('>8<')
    expect(html).toContain('>1<')
  })

  it('highlights the descending sort and the hide-empty chip', () => {
    const html = renderToStaticMarkup(
      <ReadinessSortBar
        sortKey="battles"
        sortDir="desc"
        setSortKey={vi.fn()}
        setSortDir={vi.fn()}
        hideEmpty
        setHideEmpty={vi.fn()}
      />,
    )
    expect(html).toContain('>Sort<')
    expect(html).toContain('>Most raters<')
    expect(html).toContain('>Most battles<')
    expect(html).toContain('>Most products<')
    expect(html).toContain('>Hide empty<')
    const battles = html.indexOf('>Most battles<')
    expect(html.slice(Math.max(0, battles - 180), battles)).toContain(
      'background:var(--sage-pale, #eef5f0)',
    )
  })

  it('searches categories and says how many empty rows are hidden', () => {
    const categories = renderToStaticMarkup(
      <ReadinessSearch
        query=""
        setQuery={vi.fn()}
        showL1
        filtered={{ length: 3 }}
        rows={{ length: 10 }}
        hideEmpty
        hiddenEmptyCount={4}
      />,
    )
    expect(categories).toContain('placeholder="Search categories…"')
    expect(categories).toContain('Showing 3 of 10')
    expect(categories).toContain(' · 4 empty hidden')

    const sub = renderToStaticMarkup(
      <ReadinessSearch
        query="oat"
        setQuery={vi.fn()}
        showL1={false}
        filtered={{ length: 1 }}
        rows={{ length: 1 }}
        hideEmpty={false}
        hiddenEmptyCount={0}
      />,
    )
    expect(sub).toContain('placeholder="Search sub-categories…"')
    expect(sub).toContain('value="oat"')
    expect(sub).not.toContain('empty hidden')
  })
})
