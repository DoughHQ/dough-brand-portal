import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { PrototypeListItem } from '@/lib/prototypes/types'

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
vi.mock('@/app/(portal)/prototypes/actions', () => ({
  archiveBrandPrototypeAction: async () => ({ ok: true }),
  declarePrototypeAllergensAction: async () => ({ ok: true }),
  saveBrandPrototypeAction: async () => ({ ok: true }),
}))
vi.mock('@/app/(portal)/studies/audienceActions', () => ({
  getTaxonomyNodeAction: async () => null,
}))
vi.mock('@/components/studies/audience/CategoryCombobox', () => ({
  default: () => <i>Category picker</i>,
}))
vi.mock('@/app/(portal)/prototypes/PrototypeImageUploader', () => ({
  default: () => <i>Photo uploader</i>,
}))
vi.mock('@/app/(portal)/prototypes/PrototypeAllergenDeclare', () => ({
  default: () => <i>Allergen declare</i>,
}))

import PrototypeEditor from '../../PrototypeEditor'

const initial = { id: 'p1', name: 'Honey chips' } as unknown as PrototypeListItem

function render(item: PrototypeListItem | null, state: unknown[]) {
  seeded.length = 0
  seeded.push(...state)
  budget = 12
  const html = renderToStaticMarkup(
    <PrototypeEditor
      brandId={1}
      initial={item}
      onClose={() => {}}
      onSaved={() => {}}
      onArchived={() => {}}
    />,
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

describe('PrototypeEditor', () => {
  it('renders a new prototype form in order', () => {
    const html = render(null, ['', '', 'plain_sample', '', [], null, null, [], [], false, null, null])
    inOrder(html, [
      'Add a prototype',
      'Name shown to respondents',
      'Internal label · never shown',
      'Category picker',
      'Plain sample',
      'Taste-only studies.',
      'Planned shelf price · optional',
      'Photo uploader',
      'Allergen declare',
      'Cancel',
      'Create prototype',
    ])
    expect(html).not.toContain('Archive')
  })

  it('renders an existing prototype with error and archive', () => {
    const html = render(initial, [
      'Honey chips',
      '',
      'final_packaging',
      '',
      [],
      null,
      9,
      [],
      [],
      false,
      'Pick a category.',
      'p1',
    ])
    inOrder(html, [
      'Edit prototype',
      'Honey chips',
      'Shopper-facing pack.',
      'Pick a category.',
      'Archive',
      'Save',
    ])
  })
})
