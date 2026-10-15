import { useState } from 'react'
import {
  BrandPortalProfileError,
  shapeFieldPatch,
  updateBrandPortalProfile,
  type PersistedBrandPortalProfile,
} from '@/lib/brandHome/updateBrandPortalProfile'
import type { EditableField } from './profileModel'

export function AboutField({
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
