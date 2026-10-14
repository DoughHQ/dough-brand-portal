import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import StudiesListHeader from '../StudiesListHeader'

describe('StudiesListHeader', () => {
  it('puts the studies title ahead of the new study link', () => {
    const markup = renderToStaticMarkup(<StudiesListHeader />)

    expect(markup).toContain('class="studies-header"')
    expect(markup).toContain('class="studies-title studies-title-sr"')
    expect(markup).toContain('class="studies-lede"')
    expect(markup).toContain('href="/studies/new"')
    expect(markup).toContain('class="portal-btn portal-btn-cta studies-new-study"')
    expect(markup).toContain('aria-hidden="true"')
    const title = markup.indexOf('>Studies<')
    const lede = markup.indexOf('Preference studies and results from verified consumers.')
    const link = markup.indexOf('>New study<')
    expect(title).toBeGreaterThanOrEqual(0)
    expect(lede).toBeGreaterThan(title)
    expect(link).toBeGreaterThan(lede)
  })
})
