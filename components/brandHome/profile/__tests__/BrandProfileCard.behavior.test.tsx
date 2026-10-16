// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Brand } from '@/lib/queries'
import {
  BrandPortalProfileError,
  type PersistedBrandPortalProfile,
} from '@/lib/brandHome/updateBrandPortalProfile'

const mocks = vi.hoisted(() => ({
  updateBrandPortalProfile: vi.fn(),
}))

vi.mock('@/lib/brandHome/updateBrandPortalProfile', async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import('@/lib/brandHome/updateBrandPortalProfile')
    >()
  return {
    ...actual,
    updateBrandPortalProfile: mocks.updateBrandPortalProfile,
  }
})
vi.mock('@/components/brandHome/brandHome.css', () => ({}))
vi.mock('@/components/brandHome/ParentOwnershipField', () => ({
  default: () => <span>Independent brand</span>,
}))

import BrandProfileCard from '../../BrandProfileCard'

const brand = {
  brand_id: 3,
  brand_name: 'Acme',
  brand_name_display: 'Acme',
  brand_website_url: null,
  has_portal_access: true,
  logo_url: null,
  about_text: 'Original profile.',
  brand_story: null,
  headquarters_city: null,
  headquarters_state: null,
  brand_hq_country_code: null,
  founded_year: null,
  instagram_handle: null,
  tiktok_handle: null,
  youtube_handle: null,
  x_handle: null,
  linkedin_url: null,
  sustainability_report_url: null,
  labor_policy_url: null,
  manufacturing_locations: null,
} satisfies Brand

function persisted(
  partial: Partial<PersistedBrandPortalProfile> = {},
): PersistedBrandPortalProfile {
  return {
    brand_id: brand.brand_id,
    brand_name: brand.brand_name,
    brand_name_display: brand.brand_name_display,
    about_text: brand.about_text,
    brand_story: brand.brand_story,
    brand_website_url: brand.brand_website_url,
    instagram_handle: brand.instagram_handle,
    tiktok_handle: brand.tiktok_handle,
    youtube_handle: brand.youtube_handle,
    x_handle: brand.x_handle,
    linkedin_url: brand.linkedin_url,
    headquarters_city: brand.headquarters_city,
    headquarters_state: brand.headquarters_state,
    founded_year: brand.founded_year,
    logo_url: brand.logo_url,
    updated_at: '2026-10-15T12:00:00.000Z',
    ...partial,
  }
}

function renderProfile(source: Brand = brand) {
  return render(
    <BrandProfileCard
      brand={source}
      productCount={2}
      totalBattles={20}
      canSubmitOwnershipCorrection
    />,
  )
}

beforeEach(() => {
  mocks.updateBrandPortalProfile.mockReset()
})

afterEach(cleanup)

describe('BrandProfileCard behavior', () => {
  it('saves a new brand description and updates the profile', async () => {
    mocks.updateBrandPortalProfile.mockResolvedValue(
      persisted({ about_text: 'A better profile.' }),
    )
    const user = userEvent.setup()
    renderProfile()

    await user.click(
      screen.getByRole('button', { name: 'Edit brand profile →' }),
    )
    await user.click(
      screen.getByRole('button', { name: 'Edit description' }),
    )
    const description = screen.getByRole('textbox', {
      name: '',
    })
    await user.clear(description)
    await user.type(description, 'A better profile.')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() =>
      expect(mocks.updateBrandPortalProfile).toHaveBeenCalledWith({
        about_text: 'A better profile.',
      }),
    )
    expect(await screen.findByText('A better profile.')).toBeTruthy()
    expect(screen.queryByText('Original profile.')).toBeNull()
  })

  it('keeps the description editor open after a failed save', async () => {
    mocks.updateBrandPortalProfile.mockRejectedValue(
      new BrandPortalProfileError(
        'no_effective_brand',
        'Your session does not have an active brand workspace.',
      ),
    )
    const user = userEvent.setup()
    renderProfile()

    await user.click(
      screen.getByRole('button', { name: 'Edit brand profile →' }),
    )
    await user.click(
      screen.getByRole('button', { name: 'Edit description' }),
    )
    await user.clear(screen.getByRole('textbox'))
    await user.type(screen.getByRole('textbox'), 'Unsaved profile.')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(
      await screen.findByText(
        'Your session does not have an active brand workspace.',
      ),
    ).toBeTruthy()
    expect(screen.getByDisplayValue('Unsaved profile.')).toBeTruthy()
  })

  it('expands and collapses the hidden social profiles', async () => {
    const user = userEvent.setup()
    renderProfile({
      ...brand,
      brand_website_url: 'acme.example',
      instagram_handle: 'acme-instagram',
      tiktok_handle: 'acme-tiktok',
      youtube_handle: 'acme-youtube',
      x_handle: 'acme-x',
      linkedin_url: 'linkedin.com/company/acme',
    })

    expect(screen.queryByText('@acme-tiktok')).toBeNull()
    await user.click(screen.getByRole('button', { name: '+4 profiles' }))
    expect(screen.getByText('@acme-tiktok')).toBeTruthy()
    expect(screen.getByText('@acme-x')).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Hide profiles' }))
    expect(screen.queryByText('@acme-tiktok')).toBeNull()
  })
})
