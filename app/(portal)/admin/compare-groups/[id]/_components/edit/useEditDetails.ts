import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type {
  CompareGroupDetail,
  SimilarityResult,
  UpdateCompareGroupPatch,
} from '@/lib/compareGroups.shared'
import { checkSimilarityAction, updateFieldsAction } from '../../../actions'
import {
  groupBattleLevel,
  groupDescription,
  groupName,
  groupQuestion,
  groupStatus,
  groupType,
} from '../groupHelpers'
import { STATUSES } from './editModel'

export type EditDetailsState = ReturnType<typeof useEditDetails>

export function useEditDetails({
  id,
  detail,
  onClose,
  onError,
}: {
  id: number
  detail: CompareGroupDetail
  onClose: () => void
  onError: (msg: string | null) => void
}) {
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

  return {
    name,
    setName,
    question,
    setQuestion,
    description,
    setDescription,
    type,
    setType,
    battleLevel,
    setBattleLevel,
    status,
    setStatus,
    note,
    setNote,
    saving,
    similarity,
    simLoading,
    questionChanged,
    onSubmit,
  }
}
