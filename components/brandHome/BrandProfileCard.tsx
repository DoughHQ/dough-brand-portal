'use client'

import type { Brand } from '@/lib/queries'
import {
  BRAND_VERIFICATION_UNAVAILABLE_TITLE,
  showBrandVerificationComingSoon,
} from '@/lib/brandHome/brandVerificationUi'
import { BrandProfileAbout } from './profile/BrandProfileAbout'
import { BrandProfileEditor } from './profile/BrandProfileEditor'
import { BrandProfileSummary } from './profile/BrandProfileSummary'
import { useBrandProfile } from './profile/useBrandProfile'
import './brandHome.css'

export default function BrandProfileCard({
  brand,
  productCount: _productCount,
  totalBattles: _totalBattles,
  categoriesCount: _categoriesCount,
  canSubmitOwnershipCorrection = false,
  domainVerified = false,
}: {
  brand: Brand
  productCount: number
  /** Live sum of products.total_battles (not intelligence snapshot). */
  totalBattles: number
  categoriesCount?: number
  /** brand_admin / dough_admin (incl. impersonation); hide for brand_viewer */
  canSubmitOwnershipCorrection?: boolean
  /** EXISTS verified row on brand_portal_verification — not has_portal_access. */
  domainVerified?: boolean
}) {
  const canEdit = canSubmitOwnershipCorrection
  const {
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
  } = useBrandProfile(brand)
  const showVerify = showBrandVerificationComingSoon(domainVerified)

  return (
    <div className="bp">
      <div className="brand-profile-identity bp-identity">
        <div className="bp-logo">
          {brand.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element -- signed, catalog, or uploaded photo
            <img src={brand.logo_url} alt={brand.brand_name} />
          ) : (
            brand.brand_name[0]
          )}
        </div>

        <div className="bp-copy">
          <div className="bp-title">{brand.brand_name}</div>

          <BrandProfileAbout
            brand={brand}
            profile={profile}
            editing={editing}
            setEditing={setEditing}
            editingProfile={editingProfile}
            aboutDraft={aboutDraft}
            setAboutDraft={setAboutDraft}
            saving={saving}
            setSaveError={setSaveError}
            saveAbout={saveAbout}
          />

          {!editingProfile ? (
            <BrandProfileSummary
              brand={brand}
              canEdit={canEdit}
              locationLine={locationLine}
              featured={featured}
              hidden={hidden}
              linkValues={linkValues}
              profilesOpen={profilesOpen}
              setProfilesOpen={setProfilesOpen}
              openEditor={openEditor}
            />
          ) : (
            <BrandProfileEditor
              brand={brand}
              canSubmitOwnershipCorrection={canSubmitOwnershipCorrection}
              profile={profile}
              editing={editing}
              setEditing={setEditing}
              setAboutDraft={setAboutDraft}
              setSaveError={setSaveError}
              onSaved={onSaved}
              closeEditor={closeEditor}
            />
          )}
        </div>
      </div>

      {showVerify ? (
        <p className="bp-verify">
          <span aria-hidden>◇</span> {BRAND_VERIFICATION_UNAVAILABLE_TITLE}
        </p>
      ) : null}

      {saveError ? <div className="bp-error">{saveError}</div> : null}
    </div>
  )
}
