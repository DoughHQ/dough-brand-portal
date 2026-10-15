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
vi.mock('@/lib/brandHome/brandOwnershipPortal', () => ({
  fetchActiveConglomerates: async () => [],
  submitBrandOwnershipCorrection: async () => {},
  OwnershipCorrectionError: class extends Error {},
}))

import OwnershipCorrectionModal from '../../OwnershipCorrectionModal'

const options = [
  { conglomerate_id: 1, display_name: 'Alpha Foods' },
  { conglomerate_id: 2, display_name: 'Beta Co' },
]

type Seed = {
  mode?: 'has_parent' | 'independent'
  optionsError?: string | null
  loadingOptions?: boolean
  query?: string
  selected?: (typeof options)[number] | null
  saving?: boolean
  error?: string | null
}

function render(seed: Seed, open = true, currentParentName: string | null = null) {
  seeded.length = 0
  seeded.push(
    seed.mode ?? 'has_parent',
    options,
    seed.optionsError ?? null,
    seed.loadingOptions ?? false,
    seed.query ?? '',
    seed.selected ?? null,
    '',
    '',
    seed.saving ?? false,
    seed.error ?? null,
  )
  budget = 10
  const html = renderToStaticMarkup(
    <OwnershipCorrectionModal
      open={open}
      onClose={() => {}}
      onSubmitted={() => {}}
      currentParentName={currentParentName}
    />,
  )
  budget = 0
  return html.replaceAll('<!-- -->', '')
}

function inOrder(html: string, parts: string[]) {
  let cursor = 0
  for (const part of parts) {
    const at = html.indexOf(part, cursor)
    expect(at, part).toBeGreaterThanOrEqual(0)
    cursor = at + part.length
  }
}

describe('OwnershipCorrectionModal', () => {
  it('renders nothing when closed', () => {
    expect(render({}, false)).toBe('')
  })

  it('renders the parent form in order', () => {
    const html = render({ query: 'alp' }, true, 'Parent Inc')
    inOrder(html, [
      'Suggest a parent correction',
      'Currently recorded as Parent Inc.',
      'parent company is…',
      'independent (no parent company)',
      'Parent company',
      'Search companies…',
      'Alpha Foods',
      'Notes',
      '0/2000',
      'Evidence URL',
      'Cancel',
      'Submit correction',
    ])
    expect(html).not.toContain('Beta Co')
  })

  it('renders loading, list error, and no-match states', () => {
    expect(render({ loadingOptions: true })).toContain('Loading companies…')
    expect(render({ optionsError: 'List failed' })).toContain('List failed')
    expect(render({ query: 'zzz' })).toContain('No matches')
  })

  it('renders a selection, submit error, and saving state', () => {
    const html = render({ selected: options[0], query: 'Alpha Foods', saving: true, error: 'Oops' })
    inOrder(html, ['Clear selection', 'Oops', 'Submitting…'])
  })

  it('hides the picker in independent mode', () => {
    const html = render({ mode: 'independent' })
    expect(html).not.toContain('Search companies…')
    expect(html).toContain('No parent is currently recorded.')
  })
})
