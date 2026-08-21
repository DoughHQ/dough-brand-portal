'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import type { ConceptStudyDraft } from '@/lib/concept/types'
import {
  deleteConceptDraft,
  listConceptDrafts,
  saveConceptDraft,
} from '@/lib/concept/draftStore'
import { cloneDraftAsNew } from '@/lib/concept/defaults'
import type { BoxStudyDraft } from '@/lib/box/types'
import { deleteBoxDraft, listBoxDrafts, saveBoxDraft } from '@/lib/box/draftStore'
import { cloneBoxDraftAsNew } from '@/lib/box/defaults'
import RowOverflowMenu from '../components/RowOverflowMenu'

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${Math.max(0, mins)}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  if (hrs < 48) return 'Yesterday'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const cardShell: CSSProperties = {
  background: 'var(--white)',
  border: '1px solid var(--ink-10)',
  borderRadius: 12,
  padding: '18px 20px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 16,
  minHeight: 76,
}

function CreateCard({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode
  title: string
  description: string
  action: ReactNode
}) {
  return (
    <div style={cardShell}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
        <div
          aria-hidden
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            background: 'var(--sage-soft, var(--sage-pale))',
            color: 'var(--sage-dark)',
            display: 'grid',
            placeItems: 'center',
            fontSize: 14,
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{title}</div>
          <div
            style={{
              fontSize: 13,
              color: 'var(--ink-50)',
              marginTop: 2,
              lineHeight: 1.4,
            }}
          >
            {description}
          </div>
        </div>
      </div>
      <div style={{ flexShrink: 0 }}>{action}</div>
    </div>
  )
}

const ctaLink: CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--sage)',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontFamily: 'var(--font-sans)',
  padding: 0,
}

type Props = {
  onCreateProductTest: () => void
}

export default function ConceptDraftsPanel({ onCreateProductTest }: Props) {
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

  const [boxDrafts, setBoxDrafts] = useState<BoxStudyDraft[]>([])

  const refreshBox = useCallback(() => {
    setBoxDrafts(listBoxDrafts())
  }, [])

  useEffect(() => {
    refreshBox()
  }, [refreshBox])

  function duplicateBox(source: BoxStudyDraft) {
    const copy = cloneBoxDraftAsNew(source)
    saveBoxDraft(copy)
    refreshBox()
    router.push(`/studies/box/${copy.draftId}/edit`)
  }

  function removeBox(draftId: string) {
    deleteBoxDraft(draftId)
    refreshBox()
  }

  return (
    <section style={{ marginBottom: 28 }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <CreateCard
          icon="◇"
          title="Create concept test"
          description="Validate packaging and concepts before you ship."
          action={
            <Link href="/studies/concept/new" style={ctaLink}>
              Create →
            </Link>
          }
        />
        <CreateCard
          icon="◎"
          title="Create product test"
          description="Commission a study from any product in the catalog."
          action={
            <button type="button" onClick={onCreateProductTest} style={ctaLink}>
              Create →
            </button>
          }
        />
        <CreateCard
          icon="▣"
          title="Create sampling box"
          description="Ship real products to qualified users and measure preference."
          action={
            <Link href="/studies/box/new" style={ctaLink}>
              Create →
            </Link>
          }
        />
      </div>

      {drafts.length > 0 ? (
        <div style={{ marginTop: 16 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              marginBottom: 8,
              gap: 12,
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--ink-50)',
                letterSpacing: '0.02em',
              }}
            >
              Concept drafts in progress
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-30)' }}>
              Local to this browser until publish
            </div>
          </div>
          <div
            style={{
              border: '1px solid var(--ink-10)',
              borderRadius: 12,
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
                <div style={{ minWidth: 0, flex: 1 }}>
                  <Link
                    href={`/studies/concept/${d.draftId}/edit`}
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: 'var(--ink)',
                      textDecoration: 'none',
                    }}
                  >
                    {d.title.trim() || 'Untitled concept study'}
                  </Link>
                  <div style={{ fontSize: 12, color: 'var(--ink-50)', marginTop: 3 }}>
                    {d.conceptArms.length + d.products.length} competitors · edited{' '}
                    {relativeTime(d.updatedAt)}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => router.push(`/studies/concept/${d.draftId}/edit`)}
                    style={ctaLink}
                  >
                    Continue →
                  </button>
                  <RowOverflowMenu
                    actions={[
                      { label: 'Duplicate', onClick: () => duplicate(d) },
                      {
                        label: 'Delete',
                        tone: 'danger',
                        onClick: () => remove(d.draftId),
                      },
                    ]}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {boxDrafts.length > 0 ? (
        <div style={{ marginTop: 16 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              marginBottom: 8,
              gap: 12,
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--ink-50)',
                letterSpacing: '0.02em',
              }}
            >
              Box drafts in progress
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-30)' }}>
              Local to this browser until publish
            </div>
          </div>
          <div
            style={{
              border: '1px solid var(--ink-10)',
              borderRadius: 12,
              overflow: 'hidden',
              background: 'var(--white)',
            }}
          >
            {boxDrafts.map((d, i) => {
              const resolved = d.fieldProducts.filter((r) => r.product_id != null).length
              return (
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
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <Link
                      href={`/studies/box/${d.draftId}/edit`}
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: 'var(--ink)',
                        textDecoration: 'none',
                      }}
                    >
                      {d.title.trim() || 'Untitled sampling box'}
                    </Link>
                    <div style={{ fontSize: 12, color: 'var(--ink-50)', marginTop: 3 }}>
                      {resolved} product{resolved === 1 ? '' : 's'} · edited{' '}
                      {relativeTime(d.updatedAt)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={() => router.push(`/studies/box/${d.draftId}/edit`)}
                      style={ctaLink}
                    >
                      Continue →
                    </button>
                    <RowOverflowMenu
                      actions={[
                        { label: 'Duplicate', onClick: () => duplicateBox(d) },
                        {
                          label: 'Delete',
                          tone: 'danger',
                          onClick: () => removeBox(d.draftId),
                        },
                      ]}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : null}
    </section>
  )
}
