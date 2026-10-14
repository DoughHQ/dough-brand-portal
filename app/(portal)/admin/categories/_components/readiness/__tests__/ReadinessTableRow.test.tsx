import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { ReadinessRow } from '@/lib/categoryReadiness.shared'
import { ReadinessTableRow } from '../ReadinessTableRow'

const td = { padding: '11px 12px' }

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

function markup(overrides: Partial<ReadinessRow> = {}, href: string | null = '/admin/categories/4/readiness') {
  return renderToStaticMarkup(
    <table>
      <tbody>
        <ReadinessTableRow
          row={row(overrides)}
          href={href}
          showL1
          level="l2"
          parentL2Name={undefined}
          td={td}
          handleRowClick={vi.fn()}
          stop={vi.fn()}
        />
      </tbody>
    </table>,
  )
}

describe('ReadinessTableRow', () => {
  it('shows a sellable category with its progress and previews', () => {
    const html = markup()
    expect(html).toContain('cursor:pointer')
    expect(html).toContain('>Dairy<')
    expect(html).toContain('>Oat milk<')
    expect(html).toContain('2 study battles not counted')
    expect(html).toContain('1 compare-group battle — different question, not in this ranking.')
    expect(html).toContain('>5<span')
    expect(html).toContain('/ 10')
    expect(html).toContain('width:50%')
    expect(html).toContain('background:var(--sage, #3E6B4A)')
    expect(html).toContain('>12<')
    expect(html).toContain('>3<')
    expect(html).toContain('1 / 4')
    expect(html).toContain('>—<')
    expect(html).toContain('>Sellable<')
    expect(html).toContain('href="/admin/report-preview?scope=l2&amp;id=4&amp;mode=brand"')
    expect(html).toContain('>Preview Overview<')
    expect(html).toContain('href="/admin/report-preview?scope=l2&amp;id=4&amp;mode=admin"')
    expect(html).toContain('>Admin instrument<')
    expect(html).toContain('href="/admin/categories/Oat%20milk"')
    expect(html).toContain('>Legacy rankings<')
  })

  it('mutes an empty category and leaves the last battle blank', () => {
    const html = markup(
      {
        status: 'empty',
        battles: 0,
        productsBattled: 0,
        distinctRaters: 0,
        studyBattlesExcluded: 0,
        compareGroupBattles: 0,
        l1Name: null,
      },
      null,
    )
    expect(html).toContain('opacity:0.55')
    expect(html).toContain('cursor:default')
    expect(html).toContain('>—<')
    expect(html).toContain('>Empty<')
    expect(html).toContain('opacity:0"')
  })
})
