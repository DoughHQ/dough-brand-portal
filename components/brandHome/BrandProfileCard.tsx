'use client'

import { useState } from 'react'
import type { Brand } from '@/lib/queries'
import {
  BrandPortalProfileError,
  shapeFieldPatch,
  updateBrandPortalProfile,
  type BrandPortalProfilePatch,
  type PersistedBrandPortalProfile,
} from '@/lib/brandHome/updateBrandPortalProfile'
import {
  bareHandle,
  displaySocialValue,
  isHandleField,
  socialOutboundUrl,
  type SocialLinkKey,
} from '@/lib/brandHome/socialLinks'
import {
  featuredLinkKeys,
  formatLocationLine,
  hiddenPopulatedLinkKeys,
  populatedLinkKeys,
} from '@/lib/brandHome/brandProfilePresence'
import { SocialPlatformIcon } from '@/components/brandHome/socialIcons'
import ParentOwnershipField from '@/components/brandHome/ParentOwnershipField'
import {
  BRAND_VERIFICATION_UNAVAILABLE_TITLE,
  showBrandVerificationComingSoon,
} from '@/lib/brandHome/brandVerificationUi'
import './brandHome.css'

type ProfileState = {
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

function profileFromBrand(brand: Brand): ProfileState {
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

function applyPersisted(persisted: PersistedBrandPortalProfile): ProfileState {
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

type EditableField = keyof BrandPortalProfilePatch

const LINK_DEFS: { key: SocialLinkKey; label: string; placeholder: string }[] = [
  { key: 'brand_website_url', label: 'Website', placeholder: 'yourwebsite.com' },
  { key: 'instagram_handle', label: 'Instagram', placeholder: 'handle' },
  { key: 'tiktok_handle', label: 'TikTok', placeholder: 'handle' },
  { key: 'youtube_handle', label: 'YouTube', placeholder: 'channel' },
  { key: 'x_handle', label: 'X', placeholder: 'handle' },
  { key: 'linkedin_url', label: 'LinkedIn', placeholder: 'linkedin.com/company/...' },
]

function LinkChip({
  linkKey,
  label,
  stored,
  placeholder,
  onSaved,
  onError,
}: {
  linkKey: SocialLinkKey
  label: string
  stored: string
  placeholder: string
  onSaved: (persisted: PersistedBrandPortalProfile) => void
  onError: (message: string) => void
}) {
  const [editing, setEditing] = useState(false)
  // Edit draft is always bare for handles (no @)
  const [draft, setDraft] = useState(() =>
    isHandleField(linkKey) ? bareHandle(stored) : stored
  )
  const [saving, setSaving] = useState(false)

  const href = socialOutboundUrl(linkKey, stored)
  const display = displaySocialValue(linkKey, stored)

  async function save() {
    setSaving(true)
    onError('')
    try {
      const patch = shapeFieldPatch(linkKey as EditableField, draft)
      const persisted = await updateBrandPortalProfile(patch)
      onSaved(persisted)
      setEditing(false)
    } catch (err) {
      onError(
        err instanceof BrandPortalProfileError ? err.message : 'Couldn’t save. Try again.'
      )
    } finally {
      setSaving(false)
    }
  }

  function startEdit() {
    setDraft(isHandleField(linkKey) ? bareHandle(stored) : stored)
    setEditing(true)
    onError('')
  }

  if (editing) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          minWidth: 140,
          flex: '1 1 140px',
          maxWidth: 200,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'var(--surface-1)',
              display: 'grid',
              placeItems: 'center',
              color: 'var(--ink-50)',
              flexShrink: 0,
            }}
          >
            <SocialPlatformIcon platform={linkKey} />
          </div>
          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink)' }}>{label}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {isHandleField(linkKey) ? (
            <span style={{ fontSize: 12, color: 'var(--ink-30)' }}>@</span>
          ) : null}
          <input
            autoFocus
            value={draft}
            onChange={(e) =>
              setDraft(
                isHandleField(linkKey) ? e.target.value.replace(/^@+/, '') : e.target.value
              )
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter') void save()
              if (e.key === 'Escape') setEditing(false)
            }}
            placeholder={placeholder}
            style={{
              flex: 1,
              minWidth: 0,
              padding: '4px 8px',
              borderRadius: 'var(--r-sm)',
              border: '1px solid var(--ink-30)',
              background: 'var(--surface)',
              fontSize: 12,
              color: 'var(--ink)',
              fontFamily: 'var(--font-sans)',
              outline: 'none',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            style={{
              padding: '3px 10px',
              background: 'var(--sage)',
              color: 'white',
              fontSize: 11,
              borderRadius: 4,
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {saving ? '...' : 'Save'}
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            style={{
              padding: '3px 8px',
              background: 'transparent',
              color: 'var(--ink-30)',
              fontSize: 11,
              borderRadius: 4,
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        minWidth: 140,
        flex: '1 1 140px',
        maxWidth: 200,
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: 'var(--surface-1)',
          display: 'grid',
          placeItems: 'center',
          color: 'var(--ink-50)',
          flexShrink: 0,
        }}
      >
        <SocialPlatformIcon platform={linkKey} />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 11, color: 'var(--ink-30)', marginBottom: 2 }}>{label}</div>
        {href && display ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 13,
                color: 'var(--ink)',
                textDecoration: 'none',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '100%',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
              onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
            >
              {display}
            </a>
            <button
              type="button"
              onClick={startEdit}
              style={{
                fontSize: 11,
                color: 'var(--ink-30)',
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
              }}
            >
              Edit
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={startEdit}
            style={{
              fontSize: 13,
              color: 'var(--ink-30)',
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              fontStyle: 'italic',
            }}
          >
            + Add
          </button>
        )}
      </div>
    </div>
  )
}

function AboutField({
  label,
  value,
  placeholder,
  field,
  width = 120,
  onSaved,
  onError,
}: {
  label: string
  value: string
  placeholder: string
  field: EditableField
  width?: number
  onSaved: (persisted: PersistedBrandPortalProfile) => void
  onError: (message: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    onError('')
    try {
      const patch = shapeFieldPatch(field, draft)
      const persisted = await updateBrandPortalProfile(patch)
      onSaved(persisted)
      setEditing(false)
    } catch (err) {
      onError(
        err instanceof BrandPortalProfileError ? err.message : 'Couldn’t save. Try again.'
      )
    } finally {
      setSaving(false)
    }
  }

  if (editing) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: width }}>
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--ink-30)',
          }}
        >
          {label}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void save()
              if (e.key === 'Escape') setEditing(false)
            }}
            placeholder={placeholder}
            style={{
              width,
              padding: '4px 8px',
              borderRadius: 'var(--r-sm)',
              border: '1px solid var(--ink-30)',
              background: 'var(--surface)',
              fontSize: 13,
              color: 'var(--ink)',
              fontFamily: 'var(--font-sans)',
              outline: 'none',
            }}
          />
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            style={{
              padding: '3px 8px',
              background: 'var(--sage)',
              color: 'white',
              fontSize: 11,
              borderRadius: 4,
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {saving ? '...' : 'Save'}
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            style={{
              padding: '3px 6px',
              background: 'transparent',
              color: 'var(--ink-30)',
              fontSize: 11,
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
          >
            ×
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => {
        setDraft(value)
        setEditing(true)
      }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        alignItems: 'flex-start',
        background: 'none',
        border: 'none',
        padding: '4px 8px',
        cursor: 'pointer',
        fontFamily: 'var(--font-sans)',
        borderRadius: 'var(--r-sm)',
        minWidth: width,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-1)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      <span
        style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--ink-30)',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 13,
          color: value ? 'var(--ink)' : 'var(--ink-30)',
          fontStyle: value ? 'normal' : 'italic',
        }}
      >
        {value || '+ Add'}
      </span>
    </button>
  )
}

function LocationIcon() {
  return (
    <span className="bp-meta-icon" aria-hidden>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 21s7-6.2 7-11.2A7 7 0 1 0 5 9.8C5 14.8 12 21 12 21Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="9.8" r="2.2" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    </span>
  )
}

function PresenceLink({
  linkKey,
  stored,
}: {
  linkKey: SocialLinkKey
  stored: string
}) {
  const href = socialOutboundUrl(linkKey, stored)
  const display = displaySocialValue(linkKey, stored)
  if (!href || !display) return null
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="bp-presence-link"
    >
      <SocialPlatformIcon platform={linkKey} />
      <span>{display}</span>
    </a>
  )
}

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
  const showVerify = showBrandVerificationComingSoon(domainVerified)

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

  return (
    <div className="bp">
      <div className="brand-profile-identity bp-identity">
        <div className="bp-logo">
          {brand.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={brand.logo_url} alt={brand.brand_name} />
          ) : (
            brand.brand_name[0]
          )}
        </div>

        <div className="bp-copy">
          <div className="bp-title">{brand.brand_name}</div>

          {editingProfile && editing === 'about' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
              <textarea
                autoFocus
                value={aboutDraft}
                onChange={(e) => setAboutDraft(e.target.value)}
                placeholder={`Tell people a little about ${brand.brand_name}`}
                rows={3}
                className="bp-about-input"
              />
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => void saveAbout()}
                  disabled={saving}
                  className="bp-save"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(null)
                    setAboutDraft(profile.about_text)
                    setSaveError(null)
                  }}
                  className="bp-cancel"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className={`bp-desc${profile.about_text ? '' : ' is-empty'}`}>
              {profile.about_text || `Tell people a little about ${brand.brand_name}`}
            </p>
          )}

          {!editingProfile ? (
            <>
              <div className="bp-meta">
                {locationLine ? (
                  <span className="bp-meta-item">
                    <LocationIcon />
                    {locationLine}
                  </span>
                ) : null}
                {locationLine ? <span className="bp-dot bp-dot-parent" aria-hidden>·</span> : null}
                <ParentOwnershipField
                  brandName={brand.brand_name}
                  canSubmitCorrection={false}
                  variant="summary"
                />
              </div>

              {(featured.length > 0 || hidden.length > 0) ? (
              <div className="bp-presence">
                {featured.map((key, i) => (
                  <span key={key} className="bp-presence-group">
                    {i > 0 ? <span className="bp-dot" aria-hidden>·</span> : null}
                    <PresenceLink linkKey={key} stored={linkValues[key]} />
                  </span>
                ))}
                {hidden.length > 0 ? (
                  <>
                    {featured.length > 0 ? <span className="bp-dot" aria-hidden>·</span> : null}
                    <button
                      type="button"
                      className="bp-expand"
                      aria-expanded={profilesOpen}
                      onClick={() => setProfilesOpen((open) => !open)}
                    >
                      {profilesOpen
                        ? 'Hide profiles'
                        : `+${hidden.length} profile${hidden.length === 1 ? '' : 's'}`}
                    </button>
                  </>
                ) : null}
              </div>
              ) : null}

              {profilesOpen && hidden.length > 0 ? (
                <div className="bp-presence bp-presence-more">
                  {hidden.map((key, i) => (
                    <span key={key} className="bp-presence-group">
                      {i > 0 ? <span className="bp-dot" aria-hidden>·</span> : null}
                      <PresenceLink linkKey={key} stored={linkValues[key]} />
                    </span>
                  ))}
                </div>
              ) : null}

              {canEdit ? (
                <button type="button" className="bp-edit" onClick={openEditor}>
                  Edit brand profile →
                </button>
              ) : null}
            </>
          ) : (
            <div className="bp-editor">
              {editing !== 'about' ? (
                <button
                  type="button"
                  className="bp-edit"
                  onClick={() => {
                    setAboutDraft(profile.about_text)
                    setEditing('about')
                    setSaveError(null)
                  }}
                >
                  {profile.about_text ? 'Edit description' : 'Add a brand description'}
                </button>
              ) : null}

              <div className="bp-editor-links">
                {LINK_DEFS.map((def) => (
                  <LinkChip
                    key={def.key}
                    linkKey={def.key}
                    label={def.label}
                    stored={profile[def.key]}
                    placeholder={def.placeholder}
                    onSaved={onSaved}
                    onError={(m) => setSaveError(m || null)}
                  />
                ))}
              </div>

              <div className="bp-editor-about">
                <AboutField
                  label="City"
                  value={profile.headquarters_city}
                  placeholder="New York"
                  field="headquarters_city"
                  onSaved={onSaved}
                  onError={(m) => setSaveError(m || null)}
                />
                <AboutField
                  label="State"
                  value={profile.headquarters_state}
                  placeholder="NY"
                  field="headquarters_state"
                  width={80}
                  onSaved={onSaved}
                  onError={(m) => setSaveError(m || null)}
                />
                <AboutField
                  label="Founded"
                  value={profile.founded_year}
                  placeholder="2008"
                  field="founded_year"
                  width={80}
                  onSaved={onSaved}
                  onError={(m) => setSaveError(m || null)}
                />
                <ParentOwnershipField
                  brandName={brand.brand_name}
                  canSubmitCorrection={canSubmitOwnershipCorrection}
                  variant="editor"
                />
              </div>

              <button type="button" className="bp-edit" onClick={closeEditor}>
                Done
              </button>
            </div>
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
