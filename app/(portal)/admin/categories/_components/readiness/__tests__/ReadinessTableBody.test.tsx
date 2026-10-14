import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { ReadinessRow } from '@/lib/categoryReadiness.shared'
import { ReadinessTableBody } from '../ReadinessTableBody'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

function row(overrides: Partial<ReadinessRow> = {}): ReadinessRow {
  return {
    nodeId: 4,
    l1Name: 'Dairy',
    name: 'Oat milk',
    battles: 12,
    distinctRaters: 5,
    productsBattled: 3,
    raters7d: 1,
    raters30d: 4,
    studyBattlesExcluded: 2,
    compareGroupBattles: 1,
    compareGroupRaters: 0,
    lastBattleAt: null,
    raterThreshold: 10,
    status: 'sellable',
    ...overrides,
  }
}

const sort = {
  sortKey: 'raters' as const,
  sortDir: 'desc' as const,
  toggleSort: vi.fn(),
}

describe('ReadinessTableBody', () => {
  it('says nothing was returned when the source list is empty', () => {
    const html = renderToStaticMarkup(
      <ReadinessTableBody
        showL1
        nameHeader="L2"
        {...sort}
        filtered={[]}
        rows={[]}
        level="l2"
        parentL2Name={undefined}
      />,
    )
    expect(html).toContain('No categories returned.')
    expect(html).toContain('colSpan="9"')
    expect(html).toContain('>L1<')
    expect(html).toContain('min-width:860px')
  })

  it('says the filters matched nothing and narrows the sub-category table', () => {
    const html = renderToStaticMarkup(
      <ReadinessTableBody
        showL1={false}
        nameHeader="L3"
        {...sort}
        filtered={[]}
        rows={[row()]}
        level="l3"
        parentL2Name="Oat milk"
      />,
    )
    expect(html).toContain('No categories match these filters.')
    expect(html).toContain('colSpan="8"')
    expect(html).not.toContain('>L1<')
  })

  it('renders a category row under the header', () => {
    const category = row()
    const html = renderToStaticMarkup(
      <ReadinessTableBody
        showL1
        nameHeader="L2"
        {...sort}
        filtered={[category]}
        rows={[category]}
        level="l2"
        parentL2Name={undefined}
      />,
    )
    expect(html).toContain('>Oat milk<')
    expect(html).toContain('>Raters ↓<')
    expect(html).not.toContain('No categories')
  })
})
