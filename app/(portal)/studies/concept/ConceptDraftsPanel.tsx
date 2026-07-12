'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import type { ConceptStudyDraft } from '@/lib/concept/types'
import {
  deleteConceptDraft,
  listConceptDrafts,
  saveConceptDraft,
} from '@/lib/concept/draftStore'
import { cloneDraftAsNew } from '@/lib/concept/defaults'

const ghostBtn: CSSProperties = {
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  fontFamily: 'var(--font-sans)',
  fontSize: 12,
  fontWeight: 500,
  padding: '4px 0',
  color: 'var(--ink-50)',
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${Math.max(0, mins)}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 48) return `${hrs}h ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function ConceptDraftsPanel() {
  const router = useRouter()
  const [drafts, setDrafts] = useState<ConceptStudyDraft[]>([])

  const refresh = useCallback(() => {
    setDrafts(listConceptDrafts())
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  function duplicate(source: ConceptStudyDraft) {
    const copy = cloneDraftAsNew(source)
    saveConceptDraft(copy)
    refresh()
    router.push(`/studies/concept/${copy.draftId}/edit`)
  }

  function remove(draftId: string) {
    deleteConceptDraft(draftId)
    refresh()
  }

  return (
    <section style={{ marginTop: 36 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: 14,
          gap: 12,
        }}
      >
        <div>
          <h3
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 20,
              fontWeight: 400,
              color: 'var(--ink)',
              margin: 0,
            }}
          >
            Concept drafts
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--ink-30)' }}>
            Local to this browser until publish
          </p>
        </div>
        <Link
          href="/studies/concept/new"
          style={{
            display: 'inline-block',
            background: 'var(--sage)',
            color: 'var(--white)',
            fontSize: 12,
            fontWeight: 600,
            padding: '8px 14px',
            borderRadius: 'var(--r-sm)',
            textDecoration: 'none',
            fontFamily: 'var(--font-sans)',
          }}
        >
          New concept study
        </Link>
      </div>

      {drafts.length === 0 ? (
        <div
          style={{
            border: '1px dashed var(--ink-10)',
            borderRadius: 'var(--r-md)',
            padding: '22px 18px',
            color: 'var(--ink-30)',
            fontSize: 13,
          }}
        >
          No concept drafts yet.{' '}
          <Link href="/studies/concept/new" style={{ color: 'var(--sage)' }}>
            Create one
          </Link>
        </div>
      ) : (
        <div
          style={{
            border: '1px solid var(--ink-10)',
            borderRadius: 'var(--r-md)',
            overflow: 'hidden',
            background: 'var(--white)',
          }}
        >
          {drafts.map((d, i) => (
            <div
              key={d.draftId}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                padding: '14px 16px',
                borderTop: i === 0 ? 'none' : '1px solid var(--ink-10)',
              }}
            >
              <div style={{ minWidth: 0 }}>
                <Link
                  href={`/studies/concept/${d.draftId}/edit`}
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: 'var(--ink)',
                    textDecoration: 'none',
                  }}
                >
                  {d.title.trim() || 'Untitled concept study'}
                </Link>
                <div style={{ fontSize: 12, color: 'var(--ink-30)', marginTop: 3 }}>
                  {d.conceptArms.length + d.products.length} competitors · edited{' '}
                  {relativeTime(d.updatedAt)}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 14, flexShrink: 0 }}>
                <button type="button" onClick={() => duplicate(d)} style={ghostBtn}>
                  Duplicate
                </button>
                <button
                  type="button"
                  onClick={() => remove(d.draftId)}
                  style={{ ...ghostBtn, color: 'var(--red)' }}
                >
                  Delete draft
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
