import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { CompareGroupDetail } from '@/lib/compareGroups.shared'

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
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: () => {} }) }))
vi.mock('@/app/(portal)/admin/compare-groups/actions', () => ({
  checkSimilarityAction: async () => ({ ok: true, data: null }),
  updateFieldsAction: async () => ({ ok: true }),
}))
vi.mock('@/app/(portal)/admin/compare-groups/_components/SimilarityWarnings', () => ({
  default: ({ loading }: { loading: boolean }) => <i>{loading ? 'Similarity loading' : 'Similarity idle'}</i>,
}))

import EditDetailsPanel from '../../EditDetailsPanel'

const detail = {
  group: {
    name: 'Cola',
    consumer_question: 'Which cola?',
    description: 'Sweet colas',
    type: 'benchmark',
    battle_level: 2,
    status: 'deprecated',
  },
  nodes: [{ taxonomy_node_id: 4 }],
} as unknown as CompareGroupDetail

function render(state: unknown[]) {
  seeded.length = 0
  seeded.push(...state)
  budget = state.length
  const html = renderToStaticMarkup(
    <EditDetailsPanel id={1} detail={detail} onClose={() => {}} onError={() => {}} />,
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

describe('EditDetailsPanel', () => {
  it('renders the form from the group in order', () => {
    const html = render([])
    inOrder(html, [
      'Edit details',
      'aria-label="Close"',
      'Name',
      'value="Cola"',
      'Consumer question',
      'Which cola?',
      'Description',
      'Sweet colas',
      'Type',
      '<option value="benchmark" selected="">benchmark</option>',
      'Battle level',
      'value="2"',
      'Status',
      '<option value="deprecated" selected="">deprecated</option>',
      'Reason (optional audit note)',
      'Save changes',
      'Cancel',
    ])
    expect(html).not.toContain('Similarity')
  })

  it('shows similarity once the question changes and a saving state', () => {
    const html = render(['Cola', 'Which soda?', '', 'primary', 1, 'active', '', true, null, true])
    inOrder(html, ['Which soda?', 'Similarity loading', 'Saving…'])
    expect(html).not.toContain('Save changes')
  })
})
