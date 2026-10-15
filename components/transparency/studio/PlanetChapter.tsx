import PlanetSheet from '@/components/transparency/PlanetSheet'
import InventoryGroups from './InventoryGroups'
import type { ChapterProps } from './chapterProps'

export default function PlanetChapter({
  studio,
  chapters,
  pcfAsk,
  saveRow,
  inventoryProps,
}: ChapterProps) {
  const {
    fields,
    rowsByMetric,
    canEdit,
    savingKey,
    storyError,
    errors,
    setStoryError,
    updateRow,
    ensureSubjectRow,
    handleSaveBundle,
  } = studio
  const { planetFieldsByCode, planetRestGroups } = chapters
  return (
    <>
      <PlanetSheet
        fieldsByCode={planetFieldsByCode}
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
        onSeedPackComponents={(names) => {
          const material = fields.find(
            (field) =>
              field.sub_metric_code === 'packaging_primary_material',
          )
          if (!material) return
          for (const name of names) ensureSubjectRow(material, name)
        }}
        pcfAsk={pcfAsk}
      />
      {planetRestGroups.length > 0 ? (
        <div className="tx-origin__journey">
          <div className="tx-origin__journey-head">
            <p className="tx-group__label">Land & corporate</p>
            <p className="tx-origin__journey-lede">
              Practices and corporate footprint — still available as inventory.
            </p>
          </div>
          <InventoryGroups
            {...inventoryProps}
            groups={planetRestGroups}
            forceGroupLabel
          />
        </div>
      ) : null}
    </>
  )
}
