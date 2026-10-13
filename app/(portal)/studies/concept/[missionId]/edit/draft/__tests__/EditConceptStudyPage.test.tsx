import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
vi.mock('next/navigation', () => ({
  useParams: () => ({ missionId: 'mission-9' }),
  useRouter: () => ({
    push: () => {},
    replace: () => {},
  }),
}))

import EditConceptStudyPage from '../../page'
import ConceptDraftMissing from '../ConceptDraftMissing'

describe('EditConceptStudyPage', () => {
  it('shows the loading line before the draft effect runs', () => {
    const markup = renderToStaticMarkup(<EditConceptStudyPage />)

    expect(markup).toContain('Loading draft…')
    expect(markup).toContain('padding:48px')
    expect(markup).not.toContain('Draft not found')
    expect(markup).not.toContain('class="concept-builder"')
  })

  it('offers a new concept study when the draft is missing', () => {
    const markup = renderToStaticMarkup(<ConceptDraftMissing onStartNew={() => undefined} />)

    expect(markup).toContain('max-width:560px')
    expect(markup).toContain('Draft not found')
    expect(markup).toContain(
      'This concept draft isn&#x27;t in this browser. Start a new one, or open it where it was saved.',
    )
    expect(markup).toContain('>New concept study<')
    expect(markup).not.toContain('Loading draft…')
    const title = markup.indexOf('Draft not found')
    const copy = markup.indexOf('This concept draft')
    const action = markup.indexOf('New concept study')
    expect(title).toBeGreaterThan(-1)
    expect(copy).toBeGreaterThan(title)
    expect(action).toBeGreaterThan(copy)
  })
})
