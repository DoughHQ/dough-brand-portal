import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import SuggestionDropdown from '../../SuggestionDropdown'

type Item = { id: string; name: string }

const items: Item[] = [
  { id: 'a', name: 'North Creamery' },
  { id: 'b', name: 'Already in this box' },
]

function renderList(
  overrides: Partial<Parameters<typeof SuggestionDropdown<Item>>[0]> = {},
) {
  return renderToStaticMarkup(
    createElement(SuggestionDropdown<Item>, {
      id: 'suggestions',
      status: 'idle',
      results: items,
      activeIndex: 0,
      onActiveIndex: () => {},
      onSelect: () => {},
      onRetry: () => {},
      getKey: (item) => item.id,
      renderItem: (item) => item.name,
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

describe('SuggestionDropdown', () => {
  it('renders nothing while the query is idle', () => {
    expect(renderList()).toBe('')
  })

  it('shows a searching row and the default retry copy', () => {
    const loading = renderList({ status: 'loading', results: [] })
    const error = renderList({ status: 'error', results: [] })

    expect(loading).toContain('role="listbox"')
    expect(loading).toContain('Searching…')
    expect(loading).not.toContain('role="option"')
    expect(error).toContain('Search failed — tap to retry')
    expect(error).not.toContain('Searching…')
  })

  it('shows the empty label and an optional hint', () => {
    const markup = renderList({
      status: 'empty',
      results: [],
      emptyLabel: 'No matching products',
      emptyHint: 'Try another product or brand name.',
    })

    expect(markup).not.toContain('No matches — try a different name.')
    expectOrder(markup, [
      'No matching products',
      'Try another product or brand name.',
    ])
  })

  it('marks the active option and keeps a taken option unselectable', () => {
    const markup = renderList({
      status: 'success',
      activeIndex: 0,
      isDisabled: (item) => item.id === 'b',
    })

    expect(markup).toContain('id="suggestions-opt-a"')
    expect(markup).toContain('id="suggestions-opt-b"')
    expect(markup).toContain('aria-selected="true"')
    expect(markup).toContain('aria-disabled="true"')
    expect(markup).not.toContain('Searching…')
    expectOrder(markup, [
      'id="suggestions-opt-a"',
      'aria-selected="true"',
      'North Creamery',
      'id="suggestions-opt-b"',
      'aria-disabled="true"',
      'Already in this box',
    ])
  })
})
