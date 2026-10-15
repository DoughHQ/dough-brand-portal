import type { Brand } from '@/lib/queries'
import {
  type BrandPortalProfilePatch,
  type PersistedBrandPortalProfile,
} from '@/lib/brandHome/updateBrandPortalProfile'
import { type SocialLinkKey } from '@/lib/brandHome/socialLinks'

export type ProfileState = {
  about_text: string
  brand_website_url: string
  instagram_handle: string
  tiktok_handle: string
  youtube_handle: string
  x_handle: string
  linkedin_url: string
  headquarters_city: string
  headquarters_state: string
  founded_year: string
}

export function profileFromBrand(brand: Brand): ProfileState {
  return {
    about_text: brand.about_text ?? '',
    brand_website_url: brand.brand_website_url ?? '',
    instagram_handle: brand.instagram_handle ?? '',
    tiktok_handle: brand.tiktok_handle ?? '',
    youtube_handle: brand.youtube_handle ?? '',
    x_handle: brand.x_handle ?? '',
    linkedin_url: brand.linkedin_url ?? '',
    headquarters_city: brand.headquarters_city ?? '',
    headquarters_state: brand.headquarters_state ?? '',
    founded_year: brand.founded_year != null ? String(brand.founded_year) : '',
  }
}

export function applyPersisted(persisted: PersistedBrandPortalProfile): ProfileState {
  return {
    about_text: persisted.about_text ?? '',
    brand_website_url: persisted.brand_website_url ?? '',
    instagram_handle: persisted.instagram_handle ?? '',
    tiktok_handle: persisted.tiktok_handle ?? '',
    youtube_handle: persisted.youtube_handle ?? '',
    x_handle: persisted.x_handle ?? '',
    linkedin_url: persisted.linkedin_url ?? '',
    headquarters_city: persisted.headquarters_city ?? '',
    headquarters_state: persisted.headquarters_state ?? '',
    founded_year: persisted.founded_year != null ? String(persisted.founded_year) : '',
  }
}

export type EditableField = keyof BrandPortalProfilePatch

export const LINK_DEFS: { key: SocialLinkKey; label: string; placeholder: string }[] = [
  { key: 'brand_website_url', label: 'Website', placeholder: 'yourwebsite.com' },
  { key: 'instagram_handle', label: 'Instagram', placeholder: 'handle' },
  { key: 'tiktok_handle', label: 'TikTok', placeholder: 'handle' },
  { key: 'youtube_handle', label: 'YouTube', placeholder: 'channel' },
  { key: 'x_handle', label: 'X', placeholder: 'handle' },
  { key: 'linkedin_url', label: 'LinkedIn', placeholder: 'linkedin.com/company/...' },
]
