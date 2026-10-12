import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { createEmptyConceptDraft } from '@/lib/concept/defaults'
import { PACK_SIZE_OTHER, type PackSizeOption } from '@/lib/concept/packSize'
import PackSizeField from '../../PackSizeField'
import PackSizeNotes from '../PackSizeNotes'
import PackSizeOtherInput from '../PackSizeOtherInput'
import PackSizeSelect from '../PackSizeSelect'

function renderPack(
  overrides: Partial<Parameters<typeof PackSizeField>[0]> = {},
) {
  return renderToStaticMarkup(
    createElement(PackSizeField, {
      draft: createEmptyConceptDraft(),
      onChange: () => {},
      ...overrides,
    }),
  )
}

function expectOrder(markup: string, markers: string[]) {
  let cursor = -1
  for (const marker of markers) {
    const index = markup.indexOf(marker, cursor + 1)
    expect(index, marker).toBeGreaterThan(cursor)
    cursor = index
  }
}

const pint: PackSizeOption = {
  phrase: '4-pack',
  sort_order: 1,
  family_code: 'multi',
  family_label: 'Multi',
  resolved_l2_node_id: null,
  resolved_l2_node_code: null,
}

describe('PackSizeField', () => {
  it('waits for a category before offering pack sizes', () => {
    const markup = renderPack()

    expect(markup).toContain('id="concept-q-pack_size"')
    expect(markup).toContain('class="cb-required-dot"')
    expect(markup).not.toContain('Other…')
    expect(markup).not.toContain('aria-label="Custom pack size"')
    expect(markup).not.toContain('Could not load category pack sizes')
    expectOrder(markup, [
      'Pack size',
      'id="pack_size_s0"',
      'Pick a category first',
      'id="pack_size_hint"',
      'Fills the price question.',
      'id="pack_size_preview"',
      'What would you expect to pay for a … of this?',
    ])
  })

  it('keeps a typed pack size and offers Other before options load', () => {
    const draft = createEmptyConceptDraft()
    draft.taxonomyNodeId = 12
    draft.templateConfig = { ...draft.templateConfig, pack_size: 'pint' }
    const markup = renderPack({ draft })

    expect(markup).not.toContain('class="cb-required-dot"')
    expect(markup).not.toContain('Pick a category first')
    expect(markup).not.toContain('aria-label="Custom pack size"')
    expectOrder(markup, [
      'Pack size',
      'Select pack size',
      'Other…',
      'Fills the price question.',
      'What would you expect to pay for a pint of this?',
    ])
  })

  it('lists category phrases and a loading placeholder', () => {
    const ready = renderToStaticMarkup(
      createElement(PackSizeSelect, {
        packSize: '4-pack',
        disabled: false,
        loading: false,
        selectValue: '4-pack',
        options: [pint],
        onSelectChange: () => {},
      }),
    )
    const loading = renderToStaticMarkup(
      createElement(PackSizeSelect, {
        packSize: '',
        disabled: false,
        loading: true,
        selectValue: '',
        options: [],
        onSelectChange: () => {},
      }),
    )

    expect(ready).toContain('value="4-pack"')
    expect(ready).toContain('>4-Pack<')
    expect(ready).toContain(`value="${PACK_SIZE_OTHER}"`)
    expect(ready).not.toContain('class="cb-required-dot"')
    expect(loading).toContain('Loading pack sizes…')
    expect(loading).toContain('class="cb-required-dot"')
    expect(loading).toContain('Other…')
    expectOrder(ready, ['Pack size', 'Select pack size', '4-Pack', 'Other…'])
  })

  it('shows the custom pack input and the load-error note', () => {
    const input = renderToStaticMarkup(
      createElement(PackSizeOtherInput, {
        packSize: 'club-size carton',
        setPackSize: () => {},
      }),
    )
    const notes = renderToStaticMarkup(
      createElement(PackSizeNotes, {
        loadError: true,
        packSize: 'club-size carton',
      }),
    )

    expect(input).toContain('aria-label="Custom pack size"')
    expect(input).toContain('Describe the pack (e.g. club-size carton)')
    expect(input).toContain('value="club-size carton"')
    expect(notes).toContain(
      'Could not load category pack sizes — type a custom pack size below, or re-pick the category.',
    )
    expect(notes).toContain(
      'What would you expect to pay for a club-size carton of this?',
    )
    expect(notes).not.toContain('Fills the price question.')
  })
})
