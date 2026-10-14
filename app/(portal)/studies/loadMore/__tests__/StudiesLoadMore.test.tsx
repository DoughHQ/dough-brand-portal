import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import StudiesLoadMore from '../StudiesLoadMore'

describe('StudiesLoadMore', () => {
  it('offers another page when the list is idle', () => {
    const markup = renderToStaticMarkup(
      <StudiesLoadMore loading={false} onLoadMore={() => undefined} />,
    )

    expect(markup).toContain('class="btn btn-secondary"')
    expect(markup).toContain('>Load more<')
    expect(markup).not.toContain('Loading…')
    expect(markup).not.toContain('disabled')
  })

  it('shows loading while the next page is in flight', () => {
    const markup = renderToStaticMarkup(
      <StudiesLoadMore loading onLoadMore={() => undefined} />,
    )

    expect(markup).toContain('>Loading…<')
    expect(markup).toContain('disabled=""')
    expect(markup).not.toContain('>Load more<')
  })
})
