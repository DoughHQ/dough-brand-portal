'use client'

import { useState, type CSSProperties } from 'react'
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
import { SocialPlatformIcon } from '@/components/brandHome/socialIcons'
import ParentOwnershipField from '@/components/brandHome/ParentOwnershipField'

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

const metricDivider: CSSProperties = {
  width: 1,
  alignSelf: 'stretch',
  background: 'var(--ink-10)',
  margin: '0 20px',
  flexShrink: 0,
}

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

export default function BrandProfileCard({
  brand,
  productCount,
  totalBattles,
  categoriesCount,
  canSubmitOwnershipCorrection = false,
}: {
  brand: Brand
  productCount: number
  /** Live sum of products.total_battles (not intelligence snapshot). */
  totalBattles: number
  categoriesCount?: number
  /** brand_admin / dough_admin (incl. impersonation); hide for brand_viewer */
  canSubmitOwnershipCorrection?: boolean
}) {
  const [editing, setEditing] = useState<string | null>(null)
  const [profile, setProfile] = useState<ProfileState>(() => profileFromBrand(brand))
  const [aboutDraft, setAboutDraft] = useState(brand.about_text ?? '')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

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

  const showCategories =
    typeof categoriesCount === 'number' && Number.isFinite(categoriesCount) && categoriesCount >= 0

  return (
    <div
      style={{
        background: 'var(--white)',
        border: '1px solid var(--ink-10)',
        borderRadius: 16,
        overflow: 'hidden',
      }}
    >
      {/* Identity */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(88px, 100px) minmax(0, 1fr) auto',
          gap: 24,
          padding: '22px 28px 20px',
          alignItems: 'center',
          borderBottom: '1px solid var(--ink-10)',
        }}
      >
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: 14,
            background: 'var(--sage)',
            display: 'grid',
            placeItems: 'center',
            fontFamily: 'var(--font-serif)',
            fontSize: 42,
            fontWeight: 400,
            color: 'white',
            flexShrink: 0,
            overflow: 'hidden',
          }}
        >
          {brand.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={brand.logo_url}
              alt={brand.brand_name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            brand.brand_name[0]
          )}
        </div>

        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 26,
              fontWeight: 400,
              color: 'var(--ink)',
              marginBottom: 8,
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
            }}
          >
            {brand.brand_name}
          </div>

          {editing === 'about' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <textarea
                autoFocus
                value={aboutDraft}
                onChange={(e) => setAboutDraft(e.target.value)}
                placeholder={`Tell people a little about ${brand.brand_name}`}
                rows={3}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 'var(--r-sm)',
                  border: '1px solid var(--ink-30)',
                  background: 'var(--surface)',
                  fontSize: 13,
                  color: 'var(--ink)',
                  fontFamily: 'var(--font-sans)',
                  outline: 'none',
                  resize: 'vertical',
                  lineHeight: 1.6,
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => void saveAbout()}
                  disabled={saving}
                  style={{
                    padding: '5px 14px',
                    background: 'var(--sage)',
                    color: 'white',
                    fontSize: 12,
                    fontWeight: 500,
                    borderRadius: 'var(--r-sm)',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                  }}
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
                  style={{
                    padding: '5px 14px',
                    background: 'transparent',
                    color: 'var(--ink-50)',
                    fontSize: 12,
                    borderRadius: 'var(--r-sm)',
                    border: '1px solid var(--ink-10)',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div
                style={{
                  fontSize: 14,
                  color: profile.about_text ? 'var(--ink-50)' : 'var(--ink-30)',
                  lineHeight: 1.55,
                  maxWidth: 480,
                }}
              >
                {profile.about_text || `Tell people a little about ${brand.brand_name}`}
              </div>
              <button
                type="button"
                onClick={() => {
                  setAboutDraft(profile.about_text)
                  setEditing('about')
                  setSaveError(null)
                }}
                style={{
                  marginTop: 6,
                  fontSize: 12,
                  color: 'var(--sage)',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  fontWeight: 500,
                }}
              >
                {profile.about_text ? 'Edit description' : 'Add a brand description'}
              </button>
            </div>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'stretch',
            flexShrink: 0,
            paddingLeft: 8,
          }}
        >
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'var(--ink-30)', marginBottom: 4 }}>Products on Dough</div>
            <div
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 28,
                fontWeight: 400,
                color: 'var(--ink)',
                letterSpacing: '-0.02em',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {productCount.toLocaleString()}
            </div>
          </div>
          <div style={metricDivider} />
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'var(--ink-30)', marginBottom: 4 }}>Total battles</div>
            <div
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 28,
                fontWeight: 400,
                color: 'var(--ink)',
                letterSpacing: '-0.02em',
                fontVariantNumeric: 'tabular-nums',
              }}
              title="Times your products have appeared in a head-to-head. A battle between two of your products counts for each."
            >
              {totalBattles.toLocaleString()}
            </div>
          </div>
          {showCategories ? (
            <>
              <div style={metricDivider} />
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: 'var(--ink-30)', marginBottom: 4 }}>
                  Categories
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: 28,
                    fontWeight: 400,
                    color: 'var(--ink)',
                    letterSpacing: '-0.02em',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {categoriesCount!.toLocaleString()}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* Links */}
      <div style={{ padding: '16px 28px 18px', borderBottom: '1px solid var(--ink-10)' }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--ink-30)',
            marginBottom: 14,
          }}
        >
          Links
        </div>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '18px 12px',
          }}
        >
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
      </div>

      {/* About */}
      <div
        style={{
          padding: '14px 20px 16px',
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--ink-30)',
            marginRight: 8,
            paddingLeft: 8,
          }}
        >
          About
        </div>
        <AboutField
          label="City"
          value={profile.headquarters_city}
          placeholder="New York"
          field="headquarters_city"
          onSaved={onSaved}
          onError={(m) => setSaveError(m || null)}
        />
        <div style={{ width: 1, height: 28, background: 'var(--ink-10)', margin: '0 4px' }} />
        <AboutField
          label="State"
          value={profile.headquarters_state}
          placeholder="NY"
          field="headquarters_state"
          width={80}
          onSaved={onSaved}
          onError={(m) => setSaveError(m || null)}
        />
        <div style={{ width: 1, height: 28, background: 'var(--ink-10)', margin: '0 4px' }} />
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
        />
      </div>

      {saveError ? (
        <div
          style={{
            padding: '10px 28px 14px',
            fontSize: 12,
            color: 'var(--red, #b42318)',
            borderTop: '1px solid var(--ink-10)',
          }}
        >
          {saveError}
        </div>
      ) : null}

      <style>{`
        @media (max-width: 820px) {
          .brand-profile-identity {
            grid-template-columns: 88px 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
