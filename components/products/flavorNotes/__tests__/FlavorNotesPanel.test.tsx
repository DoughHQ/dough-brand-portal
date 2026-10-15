import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { DeclarableFacetRow } from '@/lib/facets/productFacets'

const seeded: unknown[] = []
let budget = 0
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>()
  return {
    ...actual,
    useState: (init: unknown) => {
      if (budget > 0) {
        budget--
        return [seeded.shift(), () => {}]
      }
      return actual.useState(init)
    },
  }
})
vi.mock('@/lib/supabase', () => ({ createClient: () => ({}) }))
vi.mock('@/lib/facets/api', () => ({
  declareProductFacet: async () => ({ error: null }),
  withdrawProductFacetDeclaration: async () => ({ error: null }),
}))
vi.mock('@/components/products/FacetValuePicker', () => ({
  FacetChipAdd: ({ placeholder }: { placeholder: string }) => <i>{placeholder}</i>,
}))

import { FlavorNotesPanel } from '../../FlavorNotesPanel'

const row: DeclarableFacetRow = {
  facet_type: 'flavor_note',
  display_name: 'Flavour Notes',
  cardinality: 'multi',
  polarity: 'positive',
  assignability: 'brand',
  editable: true,
  requires_evidence: false,
  available_values: [
    { value: 'mint', label: 'Mint' },
    { value: 'citrus', label: 'Citrus' },
  ] as DeclarableFacetRow['available_values'],
  derived_values: null,
  declared_values: [
    { value: 'citrus', declaration_id: 1, review_state: 'auto_accepted', label: 'Citrus', brand_note: 'Bright' },
    { value: 'vanilla', declaration_id: 2, review_state: 'pending_review', label: 'Vanilla' },
  ],
}

function render(state: unknown[], extra: { canEdit?: boolean; bare?: boolean; row?: DeclarableFacetRow } = {}) {
  seeded.length = 0
  seeded.push(...state)
  budget = state.length
  const html = renderToStaticMarkup(
    <FlavorNotesPanel
      row={row}
      productId={9}
      canEdit
      busyKey={null}
      setBusyKey={() => {}}
      setError={() => {}}
      onWrote={async () => {}}
      {...extra}
    />,
  ).replaceAll('<!-- -->', '')
  budget = 0
  return html
}

function inOrder(html: string, parts: string[]) {
  let cursor = 0
  for (const part of parts) {
    const at = html.indexOf(part, cursor)
    expect(at, part).toBeGreaterThanOrEqual(0)
    cursor = at + part.length
  }
}

describe('FlavorNotesPanel', () => {
  it('renders the card with declared notes and the picker in order', () => {
    const html = render([])
    inOrder(html, [
      '<article class="pf-claim pf-notes">',
      'Flavour Notes',
      '2 descriptors',
      'Pick descriptors shoppers can filter on.',
      'aria-label="Declared flavour notes"',
      'Citrus',
      'Edit note',
      'aria-label="Remove Citrus"',
      '“Bright”',
      'pf-note pf-note--pending',
      'Vanilla',
      'Pending review',
      'Add note',
      'Add a flavour note…',
    ])
  })

  it('edits a note in place', () => {
    const html = render([null, '', 1, 'Bright'])
    inOrder(html, ['Citrus', 'Your tasting note', 'Bright', 'Cancel', 'Save note', 'Vanilla'])
    expect(html).not.toContain('“Bright”')
  })

  it('shows the draft composer instead of the picker', () => {
    const html = render(['mint', 'Cool', null, ''])
    inOrder(html, ['Adding', 'Mint', 'Your tasting note (optional)', 'Cool', 'Cancel', 'Add with note'])
    expect(html).not.toContain('Add a flavour note…')
  })

  it('renders bare and read-only with the empty state', () => {
    const html = render([], { bare: true, canEdit: false, row: { ...row, declared_values: null } })
    expect(html.startsWith('<div class="pf-claim pf-claim--bare pf-notes">')).toBe(true)
    expect(html).toContain('No flavour notes yet')
    expect(html).not.toContain('pf-notes__add')
    expect(html).not.toContain('pf-claim__badge')
  })
})
