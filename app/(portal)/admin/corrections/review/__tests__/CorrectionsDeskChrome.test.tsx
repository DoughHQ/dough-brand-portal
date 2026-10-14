import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { CorrectionsDeskEmpty } from '../CorrectionsDeskEmpty'
import { CorrectionsDeskHead } from '../CorrectionsDeskHead'
import { CorrectionsDeskNotices } from '../CorrectionsDeskNotices'
import { CorrectionsLightbox } from '../CorrectionsLightbox'

describe('corrections desk chrome', () => {
  it('shows the queue count until a product filter is on', () => {
    const open = renderToStaticMarkup(
      <CorrectionsDeskHead filtered={false} focusId={undefined} queueLabel="2 in view" />,
    )
    expect(open).toContain('>Ops<')
    expect(open).toContain('>Corrections<')
    expect(open).toContain('>2 in view<')
    expect(open).not.toContain('Filtered to this product')

    const filtered = renderToStaticMarkup(
      <CorrectionsDeskHead filtered focusId="c1" queueLabel="Nothing on this product" />,
    )
    expect(filtered).toContain('Filtered to this product')
    expect(filtered).toContain('href="/admin/corrections?focus=c1"')
    expect(filtered).toContain('>Clear<')
    expect(filtered).not.toContain('Nothing on this product')
  })

  it('stacks the error, the notice, and the flash', () => {
    expect(
      renderToStaticMarkup(
        <CorrectionsDeskNotices error={null} notice={null} flash={null} />,
      ),
    ).toBe('')
    const html = renderToStaticMarkup(
      <CorrectionsDeskNotices
        error="Pick a category first — nothing is ready to apply."
        notice="That case is gone."
        flash="Applied."
      />,
    )
    const errorAt = html.indexOf('corr-banner-error')
    const noticeAt = html.indexOf('corr-banner-info')
    const flashAt = html.indexOf('corr-banner-ok')
    expect(errorAt).toBeGreaterThan(-1)
    expect(noticeAt).toBeGreaterThan(errorAt)
    expect(flashAt).toBeGreaterThan(noticeAt)
    expect(html).toContain('Pick a category first — nothing is ready to apply.')
    expect(html).toContain('That case is gone.')
    expect(html).toContain('>Applied.<')
  })

  it('shows the empty desk for a filter, a load, and an empty inbox', () => {
    expect(
      renderToStaticMarkup(<CorrectionsDeskEmpty loadingMore filtered={false} />),
    ).toContain('Loading next…')

    const filtered = renderToStaticMarkup(
      <CorrectionsDeskEmpty loadingMore={false} filtered />,
    )
    expect(filtered).toContain('Nothing pending on this product')
    expect(filtered).toContain(
      'The filter is on. Completing a case here does not jump into the global inbox.',
    )
    expect(filtered).toContain('href="/admin/corrections"')
    expect(filtered).toContain('>Open the full queue<')

    const zero = renderToStaticMarkup(
      <CorrectionsDeskEmpty loadingMore={false} filtered={false} />,
    )
    expect(zero).toContain('Inbox zero')
    expect(zero).toContain('No corrections waiting for review.')
  })

  it('opens the evidence lightbox only when a photo is expanded', () => {
    expect(
      renderToStaticMarkup(
        <CorrectionsLightbox expandedImg={null} setExpandedImg={() => {}} />,
      ),
    ).toBe('')
    const html = renderToStaticMarkup(
      <CorrectionsLightbox
        expandedImg="https://cdn.example/evidence.jpg"
        setExpandedImg={() => {}}
      />,
    )
    expect(html).toContain('role="presentation"')
    expect(html).toContain('corr-lightbox')
    expect(html).toContain('src="https://cdn.example/evidence.jpg"')
    expect(html).toContain('alt="Evidence full size"')
  })
})
