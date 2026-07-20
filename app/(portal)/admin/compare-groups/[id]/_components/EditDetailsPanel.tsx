'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type {
  CompareGroupDetail,
  SimilarityResult,
  UpdateCompareGroupPatch,
} from '@/lib/compareGroups.shared'
import { checkSimilarityAction, updateFieldsAction } from '../../actions'
import SimilarityWarnings from '../../_components/SimilarityWarnings'
import {
  groupBattleLevel,
  groupDescription,
  groupName,
  groupQuestion,
  groupStatus,
  groupType,
} from './groupHelpers'

const TYPES = ['primary', 'alternative', 'benchmark', 'display'] as const
const STATUSES = ['active', 'deprecated'] as const

type Props = {
  id: number
  detail: CompareGroupDetail
  onClose: () => void
  onError: (msg: string | null) => void
}

export default function EditDetailsPanel({ id, detail, onClose, onError }: Props) {
  const router = useRouter()
  const g = detail.group

  const initial = useMemo(
    () => ({
      name: groupName(g),
      question: groupQuestion(g) ?? '',
      description: groupDescription(g) ?? '',
      type: groupType(g),
      battleLevel: groupBattleLevel(g),
      status: groupStatus(g) as (typeof STATUSES)[number],
      note: '',
    }),
    [g]
  )

  const [name, setName] = useState(initial.name)
  const [question, setQuestion] = useState(initial.question)
  const [description, setDescription] = useState(initial.description)
  const [type, setType] = useState(initial.type)
  const [battleLevel, setBattleLevel] = useState(initial.battleLevel)
  const [status, setStatus] = useState(initial.status)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [similarity, setSimilarity] = useState<SimilarityResult | null>(null)
  const [simLoading, setSimLoading] = useState(false)

  const nodeIds = useMemo(
    () => detail.nodes.map((n) => n.taxonomy_node_id),
    [detail.nodes]
  )

  const questionChanged = question.trim() !== (initial.question ?? '').trim()

  useEffect(() => {
    if (!questionChanged) {
      setSimilarity(null)
      return
    }
    const t = window.setTimeout(() => {
      setSimLoading(true)
      void checkSimilarityAction(nodeIds, question.trim() || null, id).then((res) => {
        setSimLoading(false)
        if (res.ok) setSimilarity(res.data)
        else setSimilarity(null)
      })
    }, 400)
    return () => window.clearTimeout(t)
  }, [questionChanged, question, nodeIds, id])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    onError(null)

    if (!name.trim()) {
      onError('Name is required.')
      return
    }
    if (!Number.isFinite(battleLevel) || battleLevel < 1) {
      onError('Battle level must be a positive integer.')
      return
    }

    const patch: UpdateCompareGroupPatch = {}
    if (name.trim() !== initial.name) patch.name = name.trim()
    if (question.trim() !== (initial.question ?? '').trim()) {
      patch.question = question.trim() || null
    }
    if (description.trim() !== (initial.description ?? '').trim()) {
      patch.description = description.trim() || null
    }
    if (type !== initial.type) patch.type = type
    if (battleLevel !== initial.battleLevel) patch.battleLevel = battleLevel
    if (status !== initial.status) patch.status = status
    if (note.trim()) patch.note = note.trim()

    if (Object.keys(patch).length === 0) {
      onClose()
      return
    }

    setSaving(true)
    const result = await updateFieldsAction(id, patch)
    setSaving(false)

    if (!result.ok) {
      onError(result.error)
      return
    }

    router.refresh()
    onClose()
  }

  return (
    <div
      style={{
        marginTop: 20,
        marginBottom: 28,
        padding: 20,
        borderRadius: 12,
        border: '1px solid var(--ink-10)',
        background: 'var(--white)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 500, color: 'var(--ink)' }}>
          Edit details
        </h2>
        <button
          type="button"
          onClick={onClose}
          style={{
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: 20,
            color: 'var(--ink-30)',
            lineHeight: 1,
          }}
          aria-label="Close"
        >
          ×
        </button>
      </div>

      <form onSubmit={(e) => void onSubmit(e)}>
        <label style={labelStyle}>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} required style={inputStyle} />
        </label>

        <label style={labelStyle}>
          Consumer question
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={3}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </label>

        <label style={labelStyle}>
          Description
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          <label style={labelStyle}>
            Type
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              style={inputStyle}
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label style={labelStyle}>
            Battle level
            <input
              type="number"
              min={1}
              step={1}
              value={battleLevel}
              onChange={(e) => setBattleLevel(Number(e.target.value))}
              style={inputStyle}
            />
          </label>
          <label style={labelStyle}>
            Status
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as (typeof STATUSES)[number])}
              style={inputStyle}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label style={labelStyle}>
          Reason (optional audit note)
          <input value={note} onChange={(e) => setNote(e.target.value)} style={inputStyle} />
        </label>

        {questionChanged && (
          <SimilarityWarnings result={similarity} loading={simLoading} />
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: '10px 16px',
              borderRadius: 6,
              border: 'none',
              background: 'var(--sage)',
              color: '#fff',
              fontSize: 14,
              fontWeight: 500,
              cursor: saving ? 'wait' : 'pointer',
              opacity: saving ? 0.7 : 1,
              fontFamily: 'var(--font-sans)',
            }}
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            style={{
              padding: '10px 16px',
              borderRadius: 6,
              border: '1px solid var(--ink-10)',
              background: 'var(--white)',
              color: 'var(--ink-50)',
              fontSize: 14,
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 500,
  color: 'var(--ink-50)',
  marginBottom: 14,
}

const inputStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  marginTop: 6,
  padding: '9px 12px',
  borderRadius: 6,
  border: '1px solid var(--ink-10)',
  fontSize: 14,
  fontFamily: 'var(--font-sans)',
  color: 'var(--ink)',
  background: 'var(--white)',
  boxSizing: 'border-box',
}
