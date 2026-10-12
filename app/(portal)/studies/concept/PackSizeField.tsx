'use client'

import type { ConceptStudyDraft } from '@/lib/concept/types'
import { templateFieldAnchor } from '@/lib/concept/templateConfig'
import PackSizeNotes from './packSize/PackSizeNotes'
import PackSizeOtherInput from './packSize/PackSizeOtherInput'
import PackSizeSelect from './packSize/PackSizeSelect'
import { usePackSizeField } from './packSize/usePackSizeField'

type Props = {
  draft: ConceptStudyDraft
  onChange: (next: ConceptStudyDraft) => void
}

export default function PackSizeField({ draft, onChange }: Props) {
  const pack = usePackSizeField(draft, onChange)

  return (
    <div id={templateFieldAnchor('pack_size')} style={{ marginTop: 24 }}>
      <PackSizeSelect
        packSize={pack.packSize}
        disabled={pack.disabled}
        loading={pack.loading}
        selectValue={pack.selectValue}
        options={pack.options}
        onSelectChange={pack.onSelectChange}
      />
      {pack.showOther && !pack.disabled ? (
        <PackSizeOtherInput packSize={pack.packSize} setPackSize={pack.setPackSize} />
      ) : null}
      <PackSizeNotes loadError={pack.loadError} packSize={pack.packSize} />
    </div>
  )
}
