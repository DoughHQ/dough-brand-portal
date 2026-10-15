import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import ScopeSearch from '../../ScopeSearch'

vi.mock('@/lib/supabase', () => ({
  createClient: () => ({ rpc: vi.fn() }),
}))

describe('ScopeSearch', () => {
  it('renders the category combobox when nothing is selected', () => {
    const html = renderToStaticMarkup(
      <ScopeSearch
        scope={null}
        scopeId={null}
        scopeName={null}
        onSelect={() => {}}
        onClear={() => {}}
      />,
    )
    expect(html).toContain('Search a category…')
    expect(html).toContain('role="combobox"')
  })

  it('renders the selected scope and a clear control', () => {
    const html = renderToStaticMarkup(
      <ScopeSearch
        scope="l2"
        scopeId={4}
        scopeName="Snacks"
        onSelect={() => {}}
        onClear={() => {}}
      />,
    )
    expect(html).toContain('Snacks')
    expect(html).toContain('aria-label="Clear category"')
    expect(html).toContain('>×</button>')
  })
})
