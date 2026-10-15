'use client'

import type { ProofSubMetricRow } from '@/lib/transparency/disclosures'
import type { BrandProofAskCount } from '@/lib/transparency/proofAskCounts'
import ChapterPane from '@/components/transparency/studio/ChapterPane'
import ChapterRail from '@/components/transparency/studio/ChapterRail'
import StudioHeader from '@/components/transparency/studio/StudioHeader'
import useStudioChapters from '@/components/transparency/studio/useStudioChapters'
import useTransparencyStudio from '@/components/transparency/studio/useTransparencyStudio'
import type { LocalRow } from '@/components/transparency/studio/types'
import './transparencyStudio.css'

type Props = {
  productId: number
  brandId: number
  canEdit: boolean
  /** Current SKU ingredient statement — seeds Formula chapter */
  ingredientStatement?: string | null
  pcfAsk?: BrandProofAskCount | null
}

export default function ProductTransparencyStudio({
  productId,
  brandId: _brandId,
  canEdit: canEditProp,
  ingredientStatement = null,
  pcfAsk = null,
}: Props) {
  void _brandId
  const studio = useTransparencyStudio({ productId, canEdit: canEditProp })
  const {
    fields,
    metrics,
    rowsByMetric,
    loading,
    loadError,
    savingKey,
    errors,
    canEdit,
    loadVersion,
    updateRow,
    addSubjectRow,
    handleSave,
  } = studio
  const chapters = useStudioChapters({
    fields,
    metrics,
    rowsByMetric,
    loading,
    loadVersion,
    ingredientStatement,
  })
  const {
    setChapterId,
    openKey,
    setOpenKey,
    progressByChapter,
    totals,
    activeChapter,
    groupsInChapter,
  } = chapters

  const saveRow = async (field: ProofSubMetricRow, row: LocalRow) => {
    const nextKey = await handleSave(field, row)
    if (nextKey) setOpenKey(nextKey)
  }

  const inventoryProps = {
    chapterGroupCount: groupsInChapter.length,
    rowsByMetric,
    canEdit,
    savingKey,
    errors,
    openKey,
    onOpenKeyChange: setOpenKey,
    onChange: updateRow,
    onSave: (field: ProofSubMetricRow, row: LocalRow) => void saveRow(field, row),
    onAddSubjectRow: addSubjectRow,
  }

  if (loading) {
    return <div className="tx-loading">Loading transparency registry…</div>
  }

  if (loadError) {
    return (
      <div className="tx-empty">
        <p className="tx-studio__title" style={{ fontSize: 22, marginBottom: 8 }}>
          Transparency
        </p>
        <p style={{ margin: 0 }}>{loadError}</p>
      </div>
    )
  }

  return (
    <div className="tx-studio">
      <StudioHeader totals={totals} />

      <div className="tx-shell">
        <ChapterRail
          progressByChapter={progressByChapter}
          activeChapter={activeChapter}
          setChapterId={setChapterId}
          setOpenKey={setOpenKey}
          rowsByMetric={rowsByMetric}
          pcfAsk={pcfAsk}
        />

        <ChapterPane
          studio={studio}
          chapters={chapters}
          ingredientStatement={ingredientStatement}
          pcfAsk={pcfAsk}
          saveRow={saveRow}
          inventoryProps={inventoryProps}
        />
      </div>
    </div>
  )
}
