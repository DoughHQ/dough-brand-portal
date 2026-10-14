import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { CompareGroupListItem } from '@/lib/compareGroups.shared'
import { CompareGroupRow } from '../CompareGroupRow'
import { CompareGroupsBody } from '../CompareGroupsBody'
import { CompareGroupsRangeFilters } from '../CompareGroupsRangeFilters'
import { CompareGroupsSearch } from '../CompareGroupsSearch'
import { CompareGroupsSortBar } from '../CompareGroupsSortBar'
import { CompareGroupsTodFilter } from '../CompareGroupsTodFilter'

function group(overrides: Partial<CompareGroupListItem> = {}): CompareGroupListItem {
  return {
    compare_group_id: 7,
    code: 'oat',
    name: 'Oat milk',
    strategy: 'single',
    status: 'active',
    type: null,
    version: 1,
    battle_level: null,
    consumer_question: 'Which oat milk?',
    has_question: true,
    node_count: 2,
    battle_count: 12,
    product_count: 0,
    respondent_count: 3,
    has_time_priors: true,
    peak_bucket: 'morning',
    peak_hours: [8, 11],
    max_prior_weight: null,
    ...overrides,
  }
}

describe('compare group table pieces', () => {
  it('shows a group, its peak hours, and a zero count', () => {
    const html = renderToStaticMarkup(
      <table>
        <tbody>
          <CompareGroupRow g={group()} />
        </tbody>
      </table>,
    )
    expect(html).toContain('href="/admin/compare-groups/7"')
    expect(html).toContain('>Oat milk<')
    expect(html).toContain('oat · 8am–11am (morning)')
    expect(html).toContain('>Which oat milk?<')
    expect(html).toContain('>0<')
    expect(html).toContain('background:rgba(62,107,74,0.12)')
    expect(html).toContain('>active<')
    expect(html).toContain('>single<')
  })

  it('uses untitled and an em dash when the name and question are missing', () => {
    const html = renderToStaticMarkup(
      <table>
        <tbody>
          <CompareGroupRow g={group({ name: null, code: null, consumer_question: '  ', peak_hours: [14], peak_bucket: null, status: null, strategy: null })} />
        </tbody>
      </table>,
    )
    expect(html).toContain('>Untitled<')
    expect(html).toContain('>2pm<')
    expect(html).toContain('>—<')
  })

  it('renders the sort, filters, search, and an empty table', () => {
    const sort = renderToStaticMarkup(
      <CompareGroupsSortBar activePreset="name" applyPreset={vi.fn()} />,
    )
    expect(sort).toContain('>Sort<')
    expect(sort).toContain('>Most respondents<')
    expect(sort).toContain('>Name A–Z<')
    expect(sort).toContain('background:var(--sage-pale, #eef5f0)')

    const ranges = renderToStaticMarkup(
      <CompareGroupsRangeFilters
        minBattles={10}
        setMinBattles={vi.fn()}
        minRespondents={0}
        setMinRespondents={vi.fn()}
      />,
    )
    expect(ranges).toContain('>≥10 battles<')
    expect(ranges).toContain('>Any respondents<')

    const tod = renderToStaticMarkup(
      <CompareGroupsTodFilter tod="any" setTod={vi.fn()} hasTodData={false} />,
    )
    expect(tod).toContain('Apply the list_compare_groups peak-TOD migration to enable this filter')
    expect(tod).toContain('only name/battle/respondent filters')
    expect(tod).toContain('disabled=""')

    const search = renderToStaticMarkup(
      <CompareGroupsSearch
        filter=""
        setFilter={vi.fn()}
        rows={{ length: 1 }}
        groups={{ length: 4 }}
      />,
    )
    expect(search).toContain('placeholder="Filter by name or question…"')
    expect(search).toContain('Showing 1 of 4')

    const body = renderToStaticMarkup(
      <CompareGroupsBody rows={[]} sortKey="name" sortDir="asc" toggleSort={vi.fn()} />,
    )
    expect(body).toContain('>Name ↑<')
    expect(body).toContain('>Question<')
    expect(body).toContain('No compare groups match these filters.')
    expect(body).toContain('colSpan="8"')
  })
})
