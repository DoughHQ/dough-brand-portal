'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import type { ConceptStudyDraft } from '@/lib/concept/types'
import { createEmptyConceptDraft } from '@/lib/concept/defaults'
import { deleteConceptDraft, saveConceptDraft } from '@/lib/concept/draftStore'
import { evaluateFieldValidity } from '@/lib/concept/validity'
import {
  createConceptCampaignAction,
  listBrandCampaignsAction,
  publishConceptMissionAction,
  type ConceptCampaignOption,
} from './actions'
import FieldSection from './FieldSection'
import QuestionsSection from './QuestionsSection'
import { ghostLink, inputBase, labelSm, pageShell, selectBase } from './conceptStyles'

type Props = {
  initialDraft: ConceptStudyDraft
  mode: 'new' | 'edit'
}

export default function ConceptStudyClient({ initialDraft, mode }: Props) {
  const router = useRouter()
  const [draft, setDraft] = useState<ConceptStudyDraft>(initialDraft)
  const [campaigns, setCampaigns] = useState<ConceptCampaignOption[]>([])
  const [campaignMode, setCampaignMode] = useState<'existing' | 'create'>(
    initialDraft.brandCampaignId ? 'existing' : 'create'
  )
  const [newCampaignName, setNewCampaignName] = useState('')
  const [pending, startTransition] = useTransition()
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [sectionErrors, setSectionErrors] = useState<{
    title?: string
    field?: string
    questions?: string
    advanced?: string
    publish?: string
  }>({})

  const validity = useMemo(() => evaluateFieldValidity(draft), [draft])

  useEffect(() => {
    void listBrandCampaignsAction(draft.brandId).then(setCampaigns)
  }, [draft.brandId])

  // Persist new drafts immediately so refresh / back-nav doesn't lose the session.
  useEffect(() => {
    if (mode === 'new') {
      saveConceptDraft(initialDraft)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once on mount
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])

  const persist = useCallback(
    (next: ConceptStudyDraft) => {
      setDraft(next)
      saveConceptDraft(next)
    },
    []
  )

  function saveDraft() {
    setSaving(true)
    const saved = saveConceptDraft(draft)
    setDraft(saved)
    setSaving(false)
    setToast('Draft saved')
    if (mode === 'new') {
      startTransition(() => {
        router.replace(`/studies/concept/${saved.draftId}/edit`)
      })
    }
  }

  async function ensureCampaign(): Promise<string | null> {
    if (campaignMode === 'existing' && draft.brandCampaignId) {
      return draft.brandCampaignId
    }
    const name =
      newCampaignName.trim() ||
      (draft.title.trim() ? `${draft.title.trim()} campaign` : 'Concept study campaign')
    const created = await createConceptCampaignAction({
      brandId: draft.brandId,
      campaignName: name,
      taxonomyNodeId: draft.taxonomyNodeId,
      sessionCount: draft.sessionCount,
    })
    if (!created.ok) {
      setSectionErrors({ title: created.error })
      return null
    }
    const next = { ...draft, brandCampaignId: created.campaignId }
    persist(next)
    setCampaignMode('existing')
    void listBrandCampaignsAction(draft.brandId).then(setCampaigns)
    return created.campaignId
  }

  async function publish() {
    setSectionErrors({})
    if (!validity.priceOk) {
      const msg =
        validity.reasons.find((r) => r.includes('priced the same way')) ??
        validity.reasons.find((r) => /price/i.test(r)) ??
        'Every competitor must be priced the same way — all priced, or none.'
      setSectionErrors({ field: msg, publish: msg })
      document.getElementById('concept-field')?.scrollIntoView({ behavior: 'smooth' })
      return
    }
    if (!validity.fieldOk || !validity.intentsOk) {
      setSectionErrors({
        field: validity.reasons[0] ?? 'Fix the field before publishing.',
        publish: validity.reasons[0] ?? 'Fix the field before publishing.',
      })
      document.getElementById('concept-field')?.scrollIntoView({ behavior: 'smooth' })
      return
    }

    setPublishing(true)
    try {
      const campaignId = await ensureCampaign()
      if (!campaignId) {
        setPublishing(false)
        return
      }

      const toPublish: ConceptStudyDraft = {
        ...draft,
        brandCampaignId: campaignId,
      }
      const result = await publishConceptMissionAction(toPublish)
      if (!result.ok) {
        setSectionErrors({
          [result.section]: result.error,
          publish: result.error,
        })
        if (result.section === 'field') {
          document.getElementById('concept-field')?.scrollIntoView({ behavior: 'smooth' })
        } else if (result.section === 'questions') {
          document.getElementById('concept-questions')?.scrollIntoView({ behavior: 'smooth' })
        }
        setPublishing(false)
        return
      }

      deleteConceptDraft(draft.draftId)
      setToast('Study published')
      startTransition(() => {
        router.push(`/studies/concept/${result.missionId}?published=1`)
      })
    } catch (err) {
      setSectionErrors({
        publish: err instanceof Error ? err.message : 'Publish failed.',
      })
      setPublishing(false)
    }
  }

  const readyLook = validity.fieldOk && validity.priceOk && validity.intentsOk

  return (
    <div style={pageShell}>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: 22,
          gap: 16,
        }}
      >
        <div>
          <Link
            href="/studies"
            style={{
              fontSize: 12,
              color: 'var(--ink-50)',
              textDecoration: 'none',
            }}
          >
            ← Studies
          </Link>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 32,
              fontWeight: 400,
              letterSpacing: '-0.02em',
              margin: '8px 0 0',
            }}
          >
            Concept study
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--ink-50)' }}>
            Operator console · brand {draft.brandId}
          </p>
        </div>
      </div>

      {toast ? (
        <div
          role="status"
          style={{
            marginBottom: 16,
            fontSize: 13,
            color: 'var(--sage-dark)',
            background: 'var(--sage-soft)',
            border: '1px solid rgba(62, 107, 74, 0.2)',
            borderRadius: 'var(--r-md)',
            padding: '10px 14px',
          }}
        >
          {toast}
        </div>
      ) : null}

      {/* Campaign picker */}
      <div
        style={{
          background: 'var(--white)',
          border: '1px solid var(--ink-10)',
          borderRadius: 'var(--r-lg)',
          padding: '18px 22px',
          marginBottom: 20,
        }}
      >
        <div style={labelSm}>Campaign</div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <button
            type="button"
            onClick={() => setCampaignMode('create')}
            style={{
              ...ghostLink,
              color: campaignMode === 'create' ? 'var(--sage)' : 'var(--ink-50)',
              fontWeight: campaignMode === 'create' ? 600 : 500,
            }}
          >
            Create new
          </button>
          <button
            type="button"
            onClick={() => setCampaignMode('existing')}
            style={{
              ...ghostLink,
              color: campaignMode === 'existing' ? 'var(--sage)' : 'var(--ink-50)',
              fontWeight: campaignMode === 'existing' ? 600 : 500,
            }}
          >
            Use existing
          </button>
        </div>
        {campaignMode === 'existing' ? (
          <select
            value={draft.brandCampaignId ?? ''}
            onChange={(e) =>
              persist({ ...draft, brandCampaignId: e.target.value || null })
            }
            style={selectBase}
          >
            <option value="">Select a campaign…</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        ) : (
          <input
            value={newCampaignName}
            onChange={(e) => setNewCampaignName(e.target.value)}
            placeholder={
              draft.title.trim()
                ? `${draft.title.trim()} campaign`
                : 'Campaign name (optional — defaults from title)'
            }
            style={inputBase}
          />
        )}
        {sectionErrors.title ? (
          <p role="alert" style={{ margin: '10px 0 0', fontSize: 13, color: 'var(--red)' }}>
            {sectionErrors.title}
          </p>
        ) : null}
      </div>

      <FieldSection
        draft={draft}
        onChange={persist}
        error={sectionErrors.field ?? null}
      />
      <QuestionsSection
        draft={draft}
        onChange={persist}
        error={sectionErrors.questions ?? null}
      />

      {sectionErrors.publish && !sectionErrors.field && !sectionErrors.questions ? (
        <p role="alert" style={{ fontSize: 13, color: 'var(--red)', marginBottom: 16 }}>
          {sectionErrors.publish}
        </p>
      ) : null}

      {/* Sticky publish bar */}
      <div
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 40,
          background: 'rgba(250, 248, 243, 0.92)',
          backdropFilter: 'blur(10px)',
          borderTop: '1px solid var(--ink-10)',
          padding: '14px 28px',
        }}
      >
        <div
          style={{
            maxWidth: 1080,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <div style={{ fontSize: 12, color: 'var(--ink-50)' }}>
            {readyLook
              ? 'Ready to publish'
              : validity.reasons[0] ?? 'Finish the field to publish'}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={saveDraft}
              disabled={saving || publishing || pending}
              style={{
                border: '1px solid var(--ink-10)',
                background: 'var(--white)',
                color: 'var(--ink)',
                fontFamily: 'var(--font-sans)',
                fontSize: 13,
                fontWeight: 500,
                padding: '10px 18px',
                borderRadius: 'var(--r-sm)',
                cursor: 'pointer',
              }}
            >
              {saving ? 'Saving…' : 'Save draft'}
            </button>
            <button
              type="button"
              onClick={() => void publish()}
              disabled={publishing || pending}
              style={{
                border: 'none',
                background: readyLook ? 'var(--sage)' : 'var(--ink-30)',
                color: 'var(--white)',
                fontFamily: 'var(--font-sans)',
                fontSize: 13,
                fontWeight: 600,
                padding: '10px 20px',
                borderRadius: 'var(--r-sm)',
                cursor: 'pointer',
                opacity: publishing ? 0.7 : 1,
              }}
            >
              {publishing ? 'Publishing…' : 'Publish study'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

