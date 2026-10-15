import { useState } from 'react'
import type { Brand } from '@/lib/queries'
import {
  BrandPortalProfileError,
  shapeFieldPatch,
  updateBrandPortalProfile,
  type PersistedBrandPortalProfile,
} from '@/lib/brandHome/updateBrandPortalProfile'
import {
  featuredLinkKeys,
  formatLocationLine,
  hiddenPopulatedLinkKeys,
  populatedLinkKeys,
} from '@/lib/brandHome/brandProfilePresence'
import { applyPersisted, profileFromBrand, type ProfileState } from './profileModel'

export type BrandProfileState = ReturnType<typeof useBrandProfile>

export function useBrandProfile(brand: Brand) {
  const [editing, setEditing] = useState<string | null>(null)
  const [editingProfile, setEditingProfile] = useState(false)
  const [profilesOpen, setProfilesOpen] = useState(false)
  const [profile, setProfile] = useState<ProfileState>(() => profileFromBrand(brand))
  const [aboutDraft, setAboutDraft] = useState(brand.about_text ?? '')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const linkValues = {
    brand_website_url: profile.brand_website_url,
    instagram_handle: profile.instagram_handle,
    tiktok_handle: profile.tiktok_handle,
    youtube_handle: profile.youtube_handle,
    x_handle: profile.x_handle,
    linkedin_url: profile.linkedin_url,
  }
  const populated = populatedLinkKeys(linkValues)
  const featured = featuredLinkKeys(populated)
  const hidden = hiddenPopulatedLinkKeys(populated, featured)
  const locationLine = formatLocationLine(profile.headquarters_city, profile.headquarters_state)

  function onSaved(persisted: PersistedBrandPortalProfile) {
    setProfile(applyPersisted(persisted))
    setSaveError(null)
  }

  async function saveAbout() {
    setSaving(true)
    setSaveError(null)
    try {
      const patch = shapeFieldPatch('about_text', aboutDraft)
      const persisted = await updateBrandPortalProfile(patch)
      onSaved(persisted)
      setAboutDraft(persisted.about_text ?? '')
      setEditing(null)
    } catch (err) {
      setSaveError(
        err instanceof BrandPortalProfileError
          ? err.message
          : 'Couldn’t save. Try again.'
      )
    } finally {
      setSaving(false)
    }
  }

  function openEditor() {
    setEditingProfile(true)
    setProfilesOpen(false)
    setAboutDraft(profile.about_text)
    setEditing(null)
    setSaveError(null)
  }

  function closeEditor() {
    setEditingProfile(false)
    setEditing(null)
    setAboutDraft(profile.about_text)
    setSaveError(null)
  }

  return {
    editing,
    setEditing,
    editingProfile,
    profilesOpen,
    setProfilesOpen,
    profile,
    aboutDraft,
    setAboutDraft,
    saving,
    saveError,
    setSaveError,
    linkValues,
    featured,
    hidden,
    locationLine,
    onSaved,
    saveAbout,
    openEditor,
    closeEditor,
  }
}
