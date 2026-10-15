import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import ImpersonateBrandClient from '../../ImpersonateBrandClient'
import { ImpersonateResults } from '../ImpersonateResults'

vi.mock('@/lib/supabase', () => ({
  createClient: () => ({ rpc: vi.fn() }),
}))
vi.mock('@/lib/portal/useEnterImpersonation', () => ({
  useEnterImpersonation: () => ({ enterAsBrand: vi.fn(), loading: false }),
}))

const hit = { brand_id: 3, brand_name: 'Acme', product_count: 12, battle_count: 340, top_elo: 1512.6 }

describe('ImpersonateBrandClient', () => {
  it('renders the search prompt before a query', () => {
    const html = renderToStaticMarkup(<ImpersonateBrandClient currentImpersonatedBrandId={null} />)
    expect(html).toContain('Platform ops')
    expect(html).toContain('Impersonate a brand')
    expect(html).toContain('the “VIEWING AS” banner will show until you exit.')
    expect(html).toContain('placeholder="Search brands by name…"')
    expect(html).toContain('Type at least 2 characters to search.')
    expect(html).not.toContain('Searching…')
  })

  it('marks the current brand and renders counts', () => {
    const html = renderToStaticMarkup(
      <ImpersonateResults
        query="ac"
        hits={[hit, { ...hit, brand_id: 4, brand_name: 'Beta', top_elo: null }]}
        searching={false}
        entering={false}
        pendingId={null}
        pick={async () => {}}
        currentImpersonatedBrandId={3}
      />,
    )
    const expected = ['Acme', 'Current', '12 products', '340 battles', ' · top Elo 1513', 'Re-enter →', 'Beta', 'View as brand →']
    let cursor = 0
    for (const text of expected) {
      const next = html.indexOf(text, cursor)
      expect(next, text).toBeGreaterThanOrEqual(0)
      cursor = next + text.length
    }
  })

  it('shows the no-match copy with curly quotes', () => {
    const html = renderToStaticMarkup(
      <ImpersonateResults
        query=" zz "
        hits={[]}
        searching={false}
        entering={false}
        pendingId={null}
        pick={async () => {}}
        currentImpersonatedBrandId={null}
      />,
    )
    expect(html).toContain('No brands match “zz”.')
  })
})
