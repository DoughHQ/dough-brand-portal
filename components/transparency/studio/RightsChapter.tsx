import RightsSheet from '@/components/transparency/RightsSheet'
import InventoryGroups from './InventoryGroups'
import type { ChapterProps } from './chapterProps'

export default function RightsChapter({
  studio,
  chapters,
  saveRow,
  inventoryProps,
}: ChapterProps) {
  const {
    rowsByMetric,
    canEdit,
    savingKey,
    storyError,
    errors,
    setStoryError,
    updateRow,
    handleSaveBundle,
  } = studio
  const { rightsFieldsByCode, rightsRestGroups } = chapters
  return (
    <>
      <RightsSheet
        fieldsByCode={rightsFieldsByCode}
        rowsByCode={rowsByMetric}
        canEdit={canEdit}
        savingKey={savingKey}
        storyError={storyError}
        errors={errors}
        onChange={updateRow}
        onSaveRow={(field, row) => void saveRow(field, row)}
        onSaveBundle={(codes, key) => void handleSaveBundle(codes, key)}
        onClearStoryError={() => setStoryError(null)}
      />
      {rightsRestGroups.length > 0 ? (
        <div className="tx-origin__journey">
          <div className="tx-origin__journey-head">
            <p className="tx-group__label">High-risk inputs</p>
            <p className="tx-origin__journey-lede">
              Named ingredients — certifications, deforestation cut-offs, and chain of
              custody. Add each input you want to disclose.
            </p>
          </div>
          <InventoryGroups
            {...inventoryProps}
            groups={rightsRestGroups}
            forceGroupLabel
          />
        </div>
      ) : null}
    </>
  )
}
