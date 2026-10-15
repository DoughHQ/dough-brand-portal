import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { DeclarableFacetRow } from '@/lib/facets/productFacets'

vi.mock('@/components/products/productFacets.css', () => ({}))
vi.mock('@/lib/supabase', () => ({ createClient: vi.fn() }))

import ProductAttributesEditor, { FACETS_LEDE } from '../../ProductAttributesEditor'
import { AttributesAddList } from '../AttributesAddList'
import { AttributesHero } from '../AttributesHero'
import { ClaimCard } from '../ClaimCard'
import { KnownTile } from '../KnownTile'

const row: DeclarableFacetRow = {
  facet_type: 'diet',
  display_name: 'Diet',
  cardinality: 'single',
  polarity: 'positive',
  assignability: 'brand',
  editable: true,
  requires_evidence: false,
  available_values: [
    { value: 'vegan', label: 'Vegan' },
    { value: 'keto', label: 'Keto' },
  ],
  derived_values: [{ value: 'gluten_free', source: 'label', label: 'Gluten free' }],
  declared_values: [
    { value: 'vegan', declaration_id: 7, review_state: 'approved', label: 'Vegan' },
    { value: 'keto', declaration_id: 8, review_state: 'pending_review', label: 'Keto' },
  ],
}

function inOrder(html: string, needles: string[]) {
  let cursor = 0
  for (const needle of needles) {
    const at = html.indexOf(needle, cursor)
    expect(at, needle).toBeGreaterThanOrEqual(0)
    cursor = at + needle.length
  }
}

describe('ProductAttributesEditor shell', () => {
  it('renders the hero and loading state before facets arrive', () => {
    const html = renderToStaticMarkup(<ProductAttributesEditor productId={1} />)
    inOrder(html, [
      'class="pf-dossier"',
      'Shopper discovery',
      'Nothing shoppers can filter on yet',
      'How this works',
      FACETS_LEDE.split("can't")[0],
      'Loading attributes…',
    ])
    expect(html).not.toContain('pf-room')
  })
})

describe('attributes pieces', () => {
  it('lists shopper discovery chips', () => {
    const html = renderToStaticMarkup(
      <AttributesHero
        shopperItems={[
          { facetType: 'diet', value: 'vegan', label: 'Vegan' },
          { facetType: 'diet', value: 'keto', label: 'Keto' },
        ]}
      />,
    )
    inOrder(html, ['pf-discovery__chips', '>Vegan<', '>Keto<'])
    expect(html).not.toContain('pf-discovery--empty')
  })

  it('renders the add list with the open row body', () => {
    const flavor = { ...row, facet_type: 'flavor_note', display_name: 'Flavour Notes' }
    const evidence = { ...row, facet_type: 'organic', display_name: 'Organic', requires_evidence: true }
    const html = renderToStaticMarkup(
      <AttributesAddList
        empty={[flavor, evidence]}
        openAdd="organic"
        setOpenAdd={vi.fn()}
        renderClaim={(r, bare) => <span data-claim={r.facet_type} data-bare={String(bare)} />}
      />,
    )
    inOrder(html, [
      'You can add',
      'pf-add-row pf-add-row--featured',
      'Flavour Notes',
      'Tasting',
      '2 options',
      'pf-add-row pf-add-row--open',
      'Organic',
      'Needs evidence',
      'data-claim="organic" data-bare="true"',
    ])
    expect(html).not.toContain('data-claim="flavor_note"')
  })

  it('renders a claim card with derived, live, and pending chips', () => {
    const html = renderToStaticMarkup(
      <ClaimCard
        row={row}
        productId={1}
        canEdit
        busyKey={null}
        setBusyKey={vi.fn()}
        setError={vi.fn()}
        onWrote={async () => {}}
      />,
    )
    inOrder(html, [
      'class="pf-claim"',
      'Diet',
      'pf-chip pf-chip--derived',
      'Gluten free',
      'pf-chip pf-chip--declared',
      'Vegan',
      'pf-chip pf-chip--pending',
      'Keto',
      'pf-claim__editor',
    ])
  })

  it('renders a bare claim without the card header', () => {
    const html = renderToStaticMarkup(
      <ClaimCard
        row={row}
        productId={1}
        canEdit={false}
        busyKey={null}
        setBusyKey={vi.fn()}
        setError={vi.fn()}
        onWrote={async () => {}}
        bare
      />,
    )
    expect(html.startsWith('<div class="pf-claim pf-claim--bare">')).toBe(true)
    expect(html).not.toContain('pf-claim__editor')
    expect(html).not.toContain('pf-chip__x')
  })

  it('renders a known tile with provenance', () => {
    const html = renderToStaticMarkup(<KnownTile row={row} />)
    inOrder(html, ['class="pf-known"', 'Diet', 'Gluten free'])
  })
})
