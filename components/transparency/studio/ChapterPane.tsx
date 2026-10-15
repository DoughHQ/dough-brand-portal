import FormulaSheet from '@/components/transparency/FormulaSheet'
import OperationsSheet from '@/components/transparency/OperationsSheet'
import InventoryGroups from './InventoryGroups'
import type { ChapterProps } from './chapterProps'
import OriginChapter from './OriginChapter'
import PlanetChapter from './PlanetChapter'
import RightsChapter from './RightsChapter'

export default function ChapterPane({
  studio,
  chapters,
  ingredientStatement,
  pcfAsk,
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
    ensureSubjectRow,
    addCustomIngredient,
    handleSaveBundle,
  } = studio
  const { activeChapter, chapterFields, groupsInChapter, operationsFieldsByCode } = chapters
  return (
    <div className="tx-pane">
      <div className="tx-pane__head">
        <p className="tx-pane__kicker">
          {activeChapter.letter} · {activeChapter.name}
        </p>
        <h3 className="tx-pane__title">{activeChapter.name}</h3>
        <p className="tx-pane__lede">{activeChapter.lede}</p>
      </div>

      {chapterFields.length === 0 ? (
        <div className="tx-empty">No product fields in this chapter yet.</div>
      ) : activeChapter.id === 'formula' ? (
        <FormulaSheet
          ingredientStatement={ingredientStatement}
          pctField={
            chapterFields.find(
              (field) => field.sub_metric_code === 'ingredient_percentage',
            ) ?? null
          }
          breakoutField={
            chapterFields.find(
              (field) => field.sub_metric_code === 'sub_ingredient_breakout',
            ) ?? null
          }
          pctRows={rowsByMetric['ingredient_percentage'] ?? []}
          breakoutRows={rowsByMetric['sub_ingredient_breakout'] ?? []}
          canEdit={canEdit}
          savingKey={savingKey}
          errors={errors}
          onChange={updateRow}
          onSave={(field, row) => void saveRow(field, row)}
          onEnsureRow={ensureSubjectRow}
          onAddCustomIngredient={addCustomIngredient}
        />
      ) : activeChapter.id === 'origin' ? (
        <OriginChapter
          studio={studio}
          chapters={chapters}
          ingredientStatement={ingredientStatement}
          pcfAsk={pcfAsk}
          saveRow={saveRow}
          inventoryProps={inventoryProps}
        />
      ) : activeChapter.id === 'operations' ? (
        <OperationsSheet
          ingredientStatement={ingredientStatement}
          fieldsByCode={operationsFieldsByCode}
          rowsByCode={rowsByMetric}
          canEdit={canEdit}
          savingKey={savingKey}
          storyError={storyError}
          errors={errors}
          onChange={updateRow}
          onEnsureRow={ensureSubjectRow}
          onSaveRow={(field, row) => void saveRow(field, row)}
          onSaveBundle={(codes, key) => void handleSaveBundle(codes, key)}
          onClearStoryError={() => setStoryError(null)}
        />
      ) : activeChapter.id === 'planet' ? (
        <PlanetChapter
          studio={studio}
          chapters={chapters}
          ingredientStatement={ingredientStatement}
          pcfAsk={pcfAsk}
          saveRow={saveRow}
          inventoryProps={inventoryProps}
        />
      ) : activeChapter.id === 'rights' ? (
        <RightsChapter
          studio={studio}
          chapters={chapters}
          ingredientStatement={ingredientStatement}
          pcfAsk={pcfAsk}
          saveRow={saveRow}
          inventoryProps={inventoryProps}
        />
      ) : (
        <InventoryGroups {...inventoryProps} groups={groupsInChapter} />
      )}
    </div>
  )
}
