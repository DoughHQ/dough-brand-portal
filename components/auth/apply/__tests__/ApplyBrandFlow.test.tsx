import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/components/auth/authShell.css', () => ({}))
vi.mock('@/lib/supabase', () => ({ createClient: vi.fn() }))

import ApplyBrandFlow from '../../ApplyBrandFlow'
import { ApplyBookingStep } from '../ApplyBookingStep'
import { ApplyDetailsStep } from '../ApplyDetailsStep'
import { ApplySearchStep } from '../ApplySearchStep'
import { ApplySessionBanner } from '../ApplySessionBanner'
import { formatProducts } from '../applyModel'

const styles = {
  cardStyle: { padding: 24 },
  inputStyle: { padding: 8 },
  labelStyle: { fontSize: 12 },
  primaryBtnStyle: (disabled: boolean) => ({ opacity: disabled ? 0.5 : 1 }),
}

const noop = vi.fn()

function inOrder(html: string, needles: string[]) {
  let cursor = 0
  for (const needle of needles) {
    const at = html.indexOf(needle, cursor)
    expect(at, needle).toBeGreaterThanOrEqual(0)
    cursor = at + needle.length
  }
}

describe('ApplyBrandFlow shell', () => {
  it('renders the search step inside the card', () => {
    const html = renderToStaticMarkup(
      <ApplyBrandFlow
        step="search"
        setStep={noop}
        error={null}
        setError={noop}
        onGoToLogin={noop}
        styles={styles}
      />,
    )
    inOrder(html, [
      '<div style="padding:24px">',
      'What’s your brand?',
      'aria-label="Brand name"',
      'I don’t see my brand →',
      'Already have access? <span>Sign in</span>',
    ])
    expect(html).not.toContain('role="status"')
  })
})

describe('apply views', () => {
  it('renders the signed-in banner', () => {
    const html = renderToStaticMarkup(
      <ApplySessionBanner signedInEmail="jane@brand.com" signingOut={false} handleSignOut={async () => {}} />,
    )
    inOrder(html, ['role="status"', 'jane@brand.com', 'sign out to request access.', 'Sign out'])
  })

  it('renders search hits, the no-match note stays hidden while hits exist', () => {
    const html = renderToStaticMarkup(
      <ApplySearchStep
        error="Couldn’t search brands. Try again."
        onGoToLogin={noop}
        styles={styles}
        query="acme"
        setQuery={noop}
        searching={false}
        hits={[
          { brand_id: 1, brand_name: 'Acme', product_count: 1, sample_products: [] },
          { brand_id: 2, brand_name: 'Acme Foods', product_count: 1200, sample_products: [] },
        ]}
        selectBrand={noop}
        searchTried
        chooseNetNew={noop}
      />,
    )
    inOrder(html, [
      'Couldn’t search brands. Try again.',
      'Acme',
      '1 product',
      'Acme Foods',
      '1,200 products',
      'I don’t see my brand →',
    ])
    expect(html).not.toContain('No brands matched')
  })

  it('renders details for a catalog brand without the brand-name field', () => {
    const html = renderToStaticMarkup(
      <ApplyDetailsStep
        error={null}
        setError={noop}
        setStep={noop}
        styles={styles}
        selectedBrand={{ brand_id: 1, brand_name: 'Acme', product_count: 3, sample_products: [] }}
        typedBrandName="Acme"
        setTypedBrandName={noop}
        contactName=""
        setContactName={noop}
        contactEmail=""
        setContactEmail={noop}
        roleTitle=""
        setRoleTitle={noop}
        linkedinUrl=""
        setLinkedinUrl={noop}
        brandWebsite=""
        setBrandWebsite={noop}
        submitting={false}
        signedInEmail="jane@brand.com"
        handleSubmit={async () => {}}
      />,
    )
    inOrder(html.replaceAll('<!-- -->', ''), [
      'Your details',
      'Applying for',
      'Acme',
      '3 products already in',
      'Your name',
      'Work email',
      'Your role at the brand',
      'LinkedIn profile',
      'Brand website',
      'disabled=""',
      'Submit application',
      'Back',
    ])
    expect(html).not.toContain('Your brand as you’d like it listed')
  })

  it('renders the booking confirmation with the first name and email', () => {
    const html = renderToStaticMarkup(
      <ApplyBookingStep contactEmail=" jane@brand.com " contactName="Jane Smith" onGoToLogin={noop} />,
    )
    inOrder(html.replaceAll('<!-- -->', ''), [
      'Application received.',
      'Thanks, Jane. We review',
      '<strong style="color:var(--ink)">jane@brand.com</strong>',
      'Questions?',
      'Already have access? Sign in',
    ])
  })

  it('formats product counts', () => {
    expect(formatProducts(1)).toBe('1 product')
    expect(formatProducts(-4)).toBe('0 products')
  })
})
