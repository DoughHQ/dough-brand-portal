import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: () => {},
    replace: () => {},
  }),
}))

import BoxDraftLoader from '../../BoxDraftLoader'

describe('BoxDraftLoader', () => {
  it('renders nothing until the stored draft loads', () => {
    const markup = renderToStaticMarkup(
      <BoxDraftLoader draftId="draft-1" effectiveBrandId={4} isImpersonating={false} />,
    )

    expect(markup).toBe('')
  })
})
