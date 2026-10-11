import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { emptyPackagingTemplateConfig } from '@/lib/concept/defaults'
import {
  BandStrip,
  Chip,
  ExpectedPriceCard,
  QCard,
  VerificationCard,
} from '../../conceptCards'

vi.mock('server-only', () => ({}))

const config = emptyPackagingTemplateConfig()

describe('concept questionnaire cards', () => {
  it('renders a locked question card with the system label', () => {
    const markup = renderToStaticMarkup(
      createElement(QCard, {
        id: 'concept-q-sample',
        title: 'How often',
        help: 'Locked by the Dough method.',
        locked: true,
      }),
    )

    expect(markup).toContain('id="concept-q-sample"')
    expect(markup).toContain('How often')
    expect(markup).toContain('SYSTEM-MANAGED')
    expect(markup).toContain('Locked by the Dough method.')
  })

  it('locks a chip and shows a remove mark on an editable one', () => {
    const markup = renderToStaticMarkup(
      createElement(
        'div',
        null,
        createElement(Chip, { label: 'None of these', tone: 'muted', locked: true }),
        createElement(Chip, { label: 'Frostline', tone: 'sage', removable: true, onRemove: () => {} }),
      ),
    )

    expect(markup).toContain('None of these')
    expect(markup).toContain('LOCKED')
    expect(markup).toContain('Frostline')
    expect(markup).toContain('>×</span>')
  })

  it('previews price bands only after an anchor exists', () => {
    const empty = renderToStaticMarkup(
      createElement(ExpectedPriceCard, {
        config,
        patchConfig: () => {},
        errorByField: new Map(),
      }),
    )
    const filled = renderToStaticMarkup(
      createElement(ExpectedPriceCard, {
        config: { ...config, expected_price: '4.99', price_display: '$4.99' },
        patchConfig: () => {},
        errorByField: new Map([['expected_price', 'Enter a real price.']]),
      }),
    )

    expect(empty).toContain('id="concept-q-expected_price"')
    expect(empty).toContain('Price expectation')
    expect(empty).toContain('placeholder="4.99"')
    expect(empty).toContain('Enter a price to preview answer bands')
    expect(filled).toContain('Shown as')
    expect(filled).toContain('Enter a real price.')
    expect(filled).not.toContain('Enter a price to preview answer bands')
  })

  it('renders a filled band strip in order', () => {
    const markup = renderToStaticMarkup(
      createElement(BandStrip, { bands: ['Under $4', '$4 to $5', 'Over $5'] }),
    )

    const under = markup.indexOf('Under $4')
    const mid = markup.indexOf('$4 to $5')
    const over = markup.indexOf('Over $5')
    expect(under).toBeGreaterThan(-1)
    expect(mid).toBeGreaterThan(under)
    expect(over).toBeGreaterThan(mid)
  })

  it('keeps purchase verification optional until brands are added', () => {
    const markup = renderToStaticMarkup(
      createElement(VerificationCard, {
        config,
        patchConfig: () => {},
        errorByField: new Map(),
      }),
    )

    expect(markup).toContain('id="concept-q-verification_options"')
    expect(markup).toContain('Purchase Verification')
    expect(markup).toContain('id="verification-brand-search"')
    expect(markup).toContain('placeholder="Type a brand name…"')
    expect(markup).toContain('None of these')
    expect(markup).toContain('LOCKED')
    expect(markup).toContain('you can publish without verification brands')
  })
})
