import { useState } from 'react'
import {
  BrandPortalProfileError,
  shapeFieldPatch,
  updateBrandPortalProfile,
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
import type { EditableField } from './profileModel'

export function LinkChip({
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
