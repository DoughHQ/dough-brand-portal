'use client'

import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import type { SelectedNode, SimilarityResult } from '@/lib/compareGroups.shared'
import { checkSimilarityAction, createCompareGroupAction } from '../actions'
import TaxonomyMultiSelect from '../_components/TaxonomyMultiSelect'
import SimilarityWarnings from '../_components/SimilarityWarnings'

const TYPES = ['primary', 'alternative', 'benchmark', 'display'] as const

export default function CreateCompareGroupForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [question, setQuestion] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<(typeof TYPES)[number]>('primary')
  const [battleLevel, setBattleLevel] = useState(1)
  const [note, setNote] = useState('')
  const [nodes, setNodes] = useState<SelectedNode[]>([])
  const [similarity, setSimilarity] = useState<SimilarityResult | null>(null)
  const [simLoading, setSimLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const nodeIds = useMemo(() => nodes.map((n) => n.taxonomy_node_id), [nodes])
  const nodeKey = nodeIds.slice().sort((a, b) => a - b).join(',')

  useEffect(() => {
    if (nodeIds.length === 0 && !question.trim()) {
      setSimilarity(null)
      return
    }
    const t = window.setTimeout(() => {
      setSimLoading(true)
      void checkSimilarityAction(nodeIds, question.trim() || null, null).then((res) => {
        setSimLoading(false)
        if (res.ok) setSimilarity(res.data)
        else setSimilarity(null)
      })
    }, 400)
    return () => window.clearTimeout(t)
  }, [nodeKey, question, nodeIds])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!name.trim()) {
      setError('Name is required.')
      return
    }
    if (!Number.isFinite(battleLevel) || battleLevel < 1) {
      setError('Battle level must be a positive integer.')
      return
    }
    setSaving(true)
    const result = await createCompareGroupAction({
      name: name.trim(),
      question: question.trim() || null,
      nodeIds,
      description: description.trim() || null,
      type,
      battleLevel,
      note: note.trim() || null,
    })
    setSaving(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    const id = result.data.group?.compare_group_id
    if (typeof id === 'number') {
      router.push(`/admin/compare-groups/${id}`)
      return
    }
    setError('Created, but could not read the new group id.')
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)}>
      {error && (
        <div
          style={{
            marginBottom: 16,
            padding: '12px 14px',
            borderRadius: 8,
            background: 'rgba(166,84,60,0.1)',
            border: '1px solid rgba(166,84,60,0.25)',
            color: 'var(--clay, #a6543c)',
            fontSize: 14,
          }}
        >
          {error}
        </div>
      )}

      <label style={labelStyle}>
        Name
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={inputStyle}
        />
      </label>

      <label style={labelStyle}>
        Consumer question
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={3}
          style={{ ...inputStyle, resize: 'vertical' }}
          placeholder="When someone reaches for…"
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <label style={labelStyle}>
          Type
          <select
            value={type}
            onChange={(e) => setType(e.target.value as (typeof TYPES)[number])}
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
      </div>

      <label style={labelStyle}>
        Reason (optional audit note)
        <input value={note} onChange={(e) => setNote(e.target.value)} style={inputStyle} />
      </label>

      <div style={{ margin: '20px 0 8px', fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>
        Nodes
      </div>
      <div
        style={{
          padding: 16,
          border: '1px solid var(--ink-10)',
          borderRadius: 12,
          background: 'var(--white)',
          marginBottom: 20,
        }}
      >
        <TaxonomyMultiSelect value={nodes} onChange={setNodes} />
      </div>

      <SimilarityWarnings result={similarity} loading={simLoading} />

      <button
        type="submit"
        disabled={saving}
        style={{
          padding: '11px 18px',
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
        {saving ? 'Saving…' : 'Create compare group'}
      </button>
    </form>
  )
}

const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 500,
  color: 'var(--ink-50)',
  marginBottom: 14,
}

const inputStyle: CSSProperties = {
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
