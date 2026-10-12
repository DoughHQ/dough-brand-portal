'use client'

import type { BoxFieldRow } from '@/lib/box/types'
import AllergenReview from './allergenConfirm/AllergenReview'
import ConfirmedAllergenBanner from './allergenConfirm/ConfirmedAllergenBanner'
import { useBoxAllergenConfirm } from './allergenConfirm/useBoxAllergenConfirm'

type Props = {
  row: BoxFieldRow
  onChange: (next: BoxFieldRow) => void
}

export default function BoxAllergenConfirm({ row, onChange }: Props) {
  const model = useBoxAllergenConfirm(row, onChange)

  if (row.product_id == null || !row.upc?.trim()) return null

  if (model.confirmed) {
    return (
      <ConfirmedAllergenBanner
        contains={model.contains}
        mayContain={model.mayContain}
        onEdit={model.startEdit}
      />
    )
  }

  return (
    <AllergenReview
      loading={model.loading}
      error={model.error}
      contains={model.contains}
      mayContain={model.mayContain}
      help={model.help}
      showPicker={model.showPicker}
      editing={model.editing}
      needsLabelCheck={model.needsLabelCheck}
      onToggle={model.toggle}
      onConfirm={model.confirm}
      onEditList={() => model.setEditing(true)}
      onHideList={() => model.setEditing(false)}
    />
  )
}
