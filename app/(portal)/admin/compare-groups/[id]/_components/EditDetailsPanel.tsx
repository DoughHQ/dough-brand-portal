'use client'

import type { CompareGroupDetail } from '@/lib/compareGroups.shared'
import SimilarityWarnings from '../../_components/SimilarityWarnings'
import { AuditNoteField } from './edit/AuditNoteField'
import { DetailsTextFields } from './edit/DetailsTextFields'
import { EditActions } from './edit/EditActions'
import { EditHeader } from './edit/EditHeader'
import { GroupMetaFields } from './edit/GroupMetaFields'
import { useEditDetails } from './edit/useEditDetails'

type Props = {
  id: number
  detail: CompareGroupDetail
  onClose: () => void
  onError: (msg: string | null) => void
}

export default function EditDetailsPanel({ id, detail, onClose, onError }: Props) {
  const edit = useEditDetails({ id, detail, onClose, onError })
  const { questionChanged, similarity, simLoading, onSubmit } = edit

  return (
    <div
      style={{
        marginTop: 20,
        marginBottom: 28,
        padding: 20,
        borderRadius: 12,
        border: '1px solid var(--ink-10)',
        background: 'var(--paper)',
      }}
    >
      <EditHeader onClose={onClose} />

      <form onSubmit={(e) => void onSubmit(e)}>
        <DetailsTextFields {...edit} />

        <GroupMetaFields {...edit} />

        <AuditNoteField {...edit} />

        {questionChanged && (
          <SimilarityWarnings result={similarity} loading={simLoading} />
        )}

        <EditActions onClose={onClose} {...edit} />
      </form>
    </div>
  )
}
