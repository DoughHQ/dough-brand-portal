import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

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
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: () => {} }) }))
vi.mock('@/lib/studies/openServerDraft', () => ({
  openServerStudyDraft: async () => ({ ok: false }),
}))

import { CommandPalette } from '../../CommandPalette'

const items = [
  { id: 'n1', label: 'Overview', href: '/dashboard', group: 'Overview' },
  { id: 'n2', label: 'Odd one', href: '/odd', group: 'Zeta' },
]

function render(open: boolean, state: unknown[], list = items) {
  seeded.length = 0
  seeded.push(...state)
  budget = 7
  const html = renderToStaticMarkup(
    <CommandPalette open={open} onOpenChange={() => {}} items={list} />,
  )
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

describe('CommandPalette', () => {
  it('renders nothing when closed', () => {
    expect(render(false, ['', 0, [], [], [], false, false])).toBe('')
  })

  it('renders idle groups in order with the active row', () => {
    const recents = [{ id: 'r1', label: 'Recent study', href: '/s/1', group: 'Recent' }]
    const drafts = [{ id: 'd1', label: 'Draft one', href: '/d', group: 'Drafts', draftId: 'x' }]
    const html = render(true, ['', 1, [], drafts, recents, false, false])
    inOrder(html, [
      'Search studies, drafts, products, categories…',
      'Recent',
      'Recent study',
      'Drafts',
      'Draft one',
      'Resume draft',
      'Overview',
      'Zeta',
      'Odd one',
      '↑↓ Navigate',
    ])
    expect(html).toMatch(/aria-selected="true"[^>]*>(?:(?!<\/button>).)*Draft one/)
  })

  it('renders empty, searching, and opening states', () => {
    expect(render(true, ['', 0, [], [], [], false, false], [])).toContain(
      'Recent destinations, drafts, and categories appear here',
    )
    expect(render(true, ['zzzz', 0, [], [], [], false, false], [])).toContain('No matches')
    expect(render(true, ['zzzz', 0, [], [], [], true, false], [])).toContain('Searching…')
    expect(render(true, ['zzzz', 0, [], [], [], false, true], [])).toContain('Opening draft…')
  })
})
