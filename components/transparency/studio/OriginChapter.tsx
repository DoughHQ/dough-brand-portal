import OriginSheet from '@/components/transparency/OriginSheet'
import InventoryGroups from './InventoryGroups'
import type { ChapterProps } from './chapterProps'

export default function OriginChapter({
  studio,
  chapters,
  ingredientStatement,
  saveRow,
  inventoryProps,
}: ChapterProps) {
  const {
    rowsByMetric,
    canEdit,
    savingKey,
    storyError,
    setStoryError,
    updateRow,
    ensureSubjectRow,
    addCustomIngredient,
    handleSaveOriginStory,
  } = studio
  const { originFieldsByCode, journeyGroups } = chapters
  return (
    <>
      <OriginSheet
        ingredientStatement={ingredientStatement}
        fieldsByCode={originFieldsByCode}
        rowsByCode={rowsByMetric}
        canEdit={canEdit}
        savingSubject={savingKey}
        storyError={storyError}
        onChange={updateRow}
        onEnsureRow={ensureSubjectRow}
        onAddCustomIngredient={addCustomIngredient}
        onSaveStory={(subject) => void handleSaveOriginStory(subject)}
        onSaveCoverage={(row) => {
          const field = originFieldsByCode['origin_coverage_pct']
          if (field) void saveRow(field, row)
        }}
        onClearStoryError={() => setStoryError(null)}
      />
      {journeyGroups.length > 0 ? (
        <div className="tx-origin__journey">
          <div className="tx-origin__journey-head">
            <p className="tx-group__label">Journey</p>
            <p className="tx-origin__journey-lede">
              Facilities, key dates, and lot codes — separate from ingredient place
              stories.
            </p>
          </div>
          <InventoryGroups
            {...inventoryProps}
            groups={journeyGroups}
            forceGroupLabel
          />
        </div>
      ) : null}
    </>
  )
}
