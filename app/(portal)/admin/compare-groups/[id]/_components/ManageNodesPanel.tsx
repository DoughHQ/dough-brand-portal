'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { CompareGroupDetail, SelectedNode, SimilarityResult } from '@/lib/compareGroups.shared'
import { checkSimilarityAction, setMembersAction } from '../../actions'
import TaxonomyMultiSelect from '../../_components/TaxonomyMultiSelect'
import SimilarityWarnings from '../../_components/SimilarityWarnings'
import { groupQuestion } from './groupHelpers'

type Props = {
  id: number
  detail: CompareGroupDetail
  onClose: () => void
  onError: (msg: string | null) => void
}

function nodesToSelected(nodes: CompareGroupDetail['nodes']): SelectedNode[] {
  return nodes.map((n) => ({
    taxonomy_node_id: n.taxonomy_node_id,
    node_name_display: n.node_name ?? `Node ${n.taxonomy_node_id}`,
    path_names_csv: n.path_names ?? '',
    l2_node_name: n.l2_node_name ?? '',
  }))
}

export default function ManageNodesPanel({ id, detail, onClose, onError }: Props) {
  const router = useRouter()
  const initialNodes = useMemo(() => nodesToSelected(detail.nodes), [detail.nodes])

  const [nodes, setNodes] = useState<SelectedNode[]>(initialNodes)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [similarity, setSimilarity] = useState<SimilarityResult | null>(null)
  const [simLoading, setSimLoading] = useState(false)

  const question = groupQuestion(detail.group)
  const nodeIds = useMemo(() => nodes.map((n) => n.taxonomy_node_id), [nodes])
  const nodeKey = nodeIds.slice().sort((a, b) => a - b).join(',')

  useEffect(() => {
    const t = window.setTimeout(() => {
      setSimLoading(true)
      void checkSimilarityAction(nodeIds, question, id).then((res) => {
        setSimLoading(false)
        if (res.ok) setSimilarity(res.data)
        else setSimilarity(null)
      })
    }, 400)
    return () => window.clearTimeout(t)
  }, [nodeKey, question, id, nodeIds])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    onError(null)

    setSaving(true)
    const result = await setMembersAction(
      id,
      nodeIds,
      note.trim() || null
    )
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
          marginBottom: 12,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 500, color: 'var(--ink)' }}>
          Manage nodes
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

      <p
        style={{
          margin: '0 0 16px',
          fontSize: 13,
          color: 'var(--ink-50)',
          lineHeight: 1.5,
        }}
      >
        This is the full set — nodes you remove are soft-closed (history preserved), nodes
        you add become active.
      </p>

      <form onSubmit={(e) => void onSubmit(e)}>
        <TaxonomyMultiSelect value={nodes} onChange={setNodes} />

        <div style={{ marginTop: 16 }}>
          <SimilarityWarnings result={similarity} loading={simLoading} />
        </div>

        <label
          style={{
            display: 'block',
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--ink-50)',
            margin: '16px 0 14px',
          }}
        >
          Reason (optional audit note)
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            style={{
              display: 'block',
              width: '100%',
              marginTop: 6,
              padding: '9px 12px',
              borderRadius: 6,
              border: '1px solid var(--ink-10)',
              fontSize: 14,
              fontFamily: 'var(--font-sans)',
              boxSizing: 'border-box',
            }}
          />
        </label>

        <div style={{ display: 'flex', gap: 10 }}>
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
            {saving ? 'Saving…' : 'Save membership'}
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
