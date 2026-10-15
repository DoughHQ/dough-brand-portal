import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { Brand } from '@/lib/queries'

vi.mock('@/components/brandHome/brandHome.css', () => ({}))
vi.mock('@/components/brandHome/ParentOwnershipField', () => ({
  default: ({ variant, canSubmitCorrection }: { variant: string; canSubmitCorrection: boolean }) => (
    <span data-ownership={variant} data-can-submit={String(canSubmitCorrection)} />
  ),
}))
vi.mock('@/lib/brandHome/updateBrandPortalProfile', () => ({
  BrandPortalProfileError: class extends Error {},
  shapeFieldPatch: vi.fn(),
  updateBrandPortalProfile: vi.fn(),
}))

import BrandProfileCard from '../../BrandProfileCard'
import { BrandProfileAbout } from '../BrandProfileAbout'
import { BrandProfileEditor } from '../BrandProfileEditor'
import { profileFromBrand } from '../profileModel'

const brand = {
  brand_name: 'Acme',
  logo_url: null,
  about_text: null,
  brand_website_url: null,
  instagram_handle: null,
  tiktok_handle: null,
  youtube_handle: null,
  x_handle: null,
  linkedin_url: null,
  headquarters_city: null,
  headquarters_state: null,
  founded_year: null,
} as unknown as Brand

function inOrder(html: string, needles: string[]) {
  let cursor = 0
  for (const needle of needles) {
    const at = html.indexOf(needle, cursor)
    expect(at, needle).toBeGreaterThanOrEqual(0)
    cursor = at + needle.length
  }
}

describe('BrandProfileCard shell', () => {
  it('renders the empty read-only summary', () => {
    const html = renderToStaticMarkup(
      <BrandProfileCard brand={brand} productCount={0} totalBattles={0} domainVerified />,
    )
    inOrder(html, [
      '<div class="bp-logo">A</div>',
      '<div class="bp-title">Acme</div>',
      '<p class="bp-desc is-empty">Tell people a little about Acme</p>',
      'data-ownership="summary"',
    ])
    expect(html).not.toContain('bp-presence')
    expect(html).not.toContain('Edit brand profile')
    expect(html).not.toContain('bp-verify')
  })

  it('renders location, featured links, hidden-profile toggle, edit, and verify in order', () => {
    const html = renderToStaticMarkup(
      <BrandProfileCard
        brand={
          {
            ...brand,
            logo_url: 'https://cdn.example/logo.png',
            about_text: 'We make snacks.',
            brand_website_url: 'acme.com',
            instagram_handle: 'acme',
            tiktok_handle: 'acme',
            youtube_handle: 'acme',
            x_handle: 'acme',
            linkedin_url: 'linkedin.com/company/acme',
            headquarters_city: 'Austin',
            headquarters_state: 'TX',
          } as Brand
        }
        productCount={3}
        totalBattles={9}
        canSubmitOwnershipCorrection
      />,
    )
    inOrder(html, [
      '<img src="https://cdn.example/logo.png" alt="Acme"/>',
      '<p class="bp-desc">We make snacks.</p>',
      'class="bp-meta-item"',
      'Austin',
      'bp-dot bp-dot-parent',
      'data-ownership="summary"',
      'class="bp-presence"',
      'class="bp-presence-link"',
      'class="bp-expand"',
      'profiles',
      'Edit brand profile →',
      'class="bp-verify"',
    ])
    expect(html).not.toContain('bp-presence-more')
    expect(html).not.toContain('bp-error')
  })
})

describe('profile views', () => {
  const profile = profileFromBrand({ ...brand, about_text: 'Hi', founded_year: 2008 } as Brand)
  const noop = vi.fn()

  it('renders the about editor when editing the description', () => {
    const html = renderToStaticMarkup(
      <BrandProfileAbout
        brand={brand}
        profile={profile}
        editing="about"
        setEditing={noop}
        editingProfile
        aboutDraft="Draft"
        setAboutDraft={noop}
        saving
        setSaveError={noop}
        saveAbout={async () => {}}
      />,
    )
    inOrder(html, ['class="bp-about-input"', 'Draft', 'Saving...', 'Cancel'])
  })

  it('renders the editor panel in order', () => {
    const html = renderToStaticMarkup(
      <BrandProfileEditor
        brand={brand}
        canSubmitOwnershipCorrection
        profile={profile}
        editing={null}
        setEditing={noop}
        setAboutDraft={noop}
        setSaveError={noop}
        onSaved={noop}
        closeEditor={noop}
      />,
    )
    inOrder(html, [
      'Edit description',
      'class="bp-editor-links"',
      'Website',
      'Instagram',
      'TikTok',
      'YouTube',
      '>X<',
      'LinkedIn',
      'class="bp-editor-about"',
      'City',
      'State',
      'Founded',
      '2008',
      'data-ownership="editor" data-can-submit="true"',
      'Done',
    ])
  })
})
