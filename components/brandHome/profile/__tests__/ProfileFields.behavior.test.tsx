// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  BrandPortalProfileError,
  type PersistedBrandPortalProfile,
} from '@/lib/brandHome/updateBrandPortalProfile'
import { AboutField } from '../AboutField'
import { LinkChip } from '../LinkChip'

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

function persisted(
  partial: Partial<PersistedBrandPortalProfile> = {},
): PersistedBrandPortalProfile {
  return {
    brand_id: 3,
    brand_name: 'Acme',
    brand_name_display: 'Acme',
    about_text: null,
    brand_story: null,
    brand_website_url: null,
    instagram_handle: null,
    tiktok_handle: null,
    youtube_handle: null,
    x_handle: null,
    linkedin_url: null,
    headquarters_city: null,
    headquarters_state: null,
    founded_year: null,
    logo_url: null,
    updated_at: '2026-10-15T12:00:00.000Z',
    ...partial,
  }
}

beforeEach(() => {
  mocks.updateBrandPortalProfile.mockReset()
})

afterEach(cleanup)

describe('brand profile field behavior', () => {
  it('normalizes and saves a social handle', async () => {
    mocks.updateBrandPortalProfile.mockResolvedValue(
      persisted({ instagram_handle: 'newhandle' }),
    )
    const user = userEvent.setup()
    const onSaved = vi.fn()
    const onError = vi.fn()
    render(
      <LinkChip
        linkKey="instagram_handle"
        label="Instagram"
        stored=""
        placeholder="handle"
        onSaved={onSaved}
        onError={onError}
      />,
    )

    await user.click(screen.getByRole('button', { name: '+ Add' }))
    await user.type(screen.getByPlaceholderText('handle'), '@newhandle')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(mocks.updateBrandPortalProfile).toHaveBeenCalledWith({
      instagram_handle: 'newhandle',
    })
    expect(onSaved).toHaveBeenCalledWith(
      expect.objectContaining({ instagram_handle: 'newhandle' }),
    )
    expect(onError).toHaveBeenCalledWith('')
  })

  it('reports a link save failure without leaving edit mode', async () => {
    mocks.updateBrandPortalProfile.mockRejectedValue(
      new BrandPortalProfileError('save_failed', 'Profile service unavailable.'),
    )
    const user = userEvent.setup()
    const onError = vi.fn()
    render(
      <LinkChip
        linkKey="brand_website_url"
        label="Website"
        stored="old.example"
        placeholder="yourwebsite.com"
        onSaved={vi.fn()}
        onError={onError}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Edit' }))
    await user.clear(screen.getByPlaceholderText('yourwebsite.com'))
    await user.type(
      screen.getByPlaceholderText('yourwebsite.com'),
      'new.example',
    )
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(onError).toHaveBeenLastCalledWith('Profile service unavailable.')
    expect(screen.getByDisplayValue('new.example')).toBeTruthy()
  })

  it('rejects a fractional founding year before making a request', async () => {
    const user = userEvent.setup()
    const onError = vi.fn()
    render(
      <AboutField
        label="Founded"
        value=""
        placeholder="2008"
        field="founded_year"
        onSaved={vi.fn()}
        onError={onError}
      />,
    )

    await user.click(screen.getByRole('button', { name: /Founded/ }))
    await user.type(screen.getByPlaceholderText('2008'), '2008.5')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(mocks.updateBrandPortalProfile).not.toHaveBeenCalled()
    expect(onError).toHaveBeenLastCalledWith(
      'Founded year must be a whole number.',
    )
    expect(screen.getByDisplayValue('2008.5')).toBeTruthy()
  })
})
