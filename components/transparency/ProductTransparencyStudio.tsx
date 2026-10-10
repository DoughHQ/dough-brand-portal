'use client'

import { useEffect, useMemo, useState } from 'react'
import FormulaSheet from '@/components/transparency/FormulaSheet'
import OriginSheet from '@/components/transparency/OriginSheet'
import OperationsSheet from '@/components/transparency/OperationsSheet'
import PlanetSheet from '@/components/transparency/PlanetSheet'
import RightsSheet, {
  RIGHTS_RISK_METRIC,
} from '@/components/transparency/RightsSheet'
import InventoryGroups from '@/components/transparency/studio/InventoryGroups'
import {
  buildFieldsByChapter,
  calculateProgressByChapter,
  calculateTotals,
  depthSummary,
  selectDefaultChapter,
} from '@/components/transparency/studio/progress'
import useTransparencyStudio from '@/components/transparency/studio/useTransparencyStudio'
import type {
  InventoryGroup,
  LocalRow,
} from '@/components/transparency/studio/types'
import type { ProofSubMetricRow } from '@/lib/transparency/disclosures'
import {
  PROOF_CHAPTERS,
  type ProofChapterId,
} from '@/lib/transparency/proofChapters'
import {
  proofTabAskBadge,
  type BrandProofAskCount,
} from '@/lib/transparency/proofAskCounts'
import './transparencyStudio.css'

type Props = {
  productId: number
  brandId: number
  canEdit: boolean
  /** Current SKU ingredient statement — seeds Formula chapter */
  ingredientStatement?: string | null
  pcfAsk?: BrandProofAskCount | null
}

function indexFields(
  fields: ProofSubMetricRow[],
): Record<string, ProofSubMetricRow | undefined> {
  const byCode: Record<string, ProofSubMetricRow | undefined> = {}
  for (const field of fields) byCode[field.sub_metric_code] = field
  return byCode
}

export default function ProductTransparencyStudio({
  productId,
  brandId: _brandId,
  canEdit: canEditProp,
  ingredientStatement = null,
  pcfAsk = null,
}: Props) {
  void _brandId
  const {
    fields,
    metrics,
    rowsByMetric,
    loading,
    loadError,
    savingKey,
    storyError,
    errors,
    canEdit,
    loadVersion,
    setStoryError,
    updateRow,
    ensureSubjectRow,
    addCustomIngredient,
    addSubjectRow,
    handleSave,
    handleSaveOriginStory,
    handleSaveBundle,
  } = useTransparencyStudio({ productId, canEdit: canEditProp })
  const [chapterId, setChapterId] = useState<ProofChapterId>('planet')
  const [openKey, setOpenKey] = useState<string | null>(null)
  const [chapterReadyForLoad, setChapterReadyForLoad] = useState(0)

  const fieldsByChapter = useMemo(() => buildFieldsByChapter(fields), [fields])
  const progressByChapter = useMemo(
    () =>
      calculateProgressByChapter({
        fieldsByChapter,
        rowsByMetric,
        ingredientStatement,
      }),
    [fieldsByChapter, rowsByMetric, ingredientStatement],
  )
  const totals = useMemo(
    () => calculateTotals(progressByChapter),
    [progressByChapter],
  )

  // Open the chapter with the most unfinished work once per load.
  useEffect(() => {
    if (loading || chapterReadyForLoad === loadVersion || fields.length === 0) return
    setChapterId(selectDefaultChapter(progressByChapter))
    setChapterReadyForLoad(loadVersion)
  }, [
    loading,
    chapterReadyForLoad,
    loadVersion,
    fields.length,
    progressByChapter,
  ])

  const activeChapter =
    PROOF_CHAPTERS.find((chapter) => chapter.id === chapterId) ??
    PROOF_CHAPTERS[0]!
  const chapterFields = fieldsByChapter[activeChapter.id]

  const metricLabel = useMemo(() => {
    const labels = new Map(metrics.map((metric) => [metric.metric_code, metric.label]))
    return (code: string) => labels.get(code) ?? code
  }, [metrics])

  const groupsInChapter = useMemo(() => {
    const order: string[] = []
    const grouped = new Map<string, ProofSubMetricRow[]>()
    for (const field of chapterFields) {
      if (!grouped.has(field.metric_code)) {
        grouped.set(field.metric_code, [])
        order.push(field.metric_code)
      }
      grouped.get(field.metric_code)!.push(field)
    }
    return order.map<InventoryGroup>((metricCode) => ({
      metricCode,
      label: metricLabel(metricCode),
      fields: grouped.get(metricCode)!,
    }))
  }, [chapterFields, metricLabel])

  const originFieldsByCode = useMemo(
    () =>
      indexFields(
        fieldsByChapter.origin.filter((field) => field.metric_code === 'origin'),
      ),
    [fieldsByChapter.origin],
  )
  const operationsFieldsByCode = useMemo(
    () => indexFields(fieldsByChapter.operations),
    [fieldsByChapter.operations],
  )
  const planetFieldsByCode = useMemo(
    () => indexFields(fieldsByChapter.planet),
    [fieldsByChapter.planet],
  )
  const rightsFieldsByCode = useMemo(
    () => indexFields(fieldsByChapter.rights),
    [fieldsByChapter.rights],
  )

  const journeyGroups = useMemo(
    () => groupsInChapter.filter((group) => group.metricCode !== 'origin'),
    [groupsInChapter],
  )
  const planetRestGroups = useMemo(
    () =>
      groupsInChapter.filter(
        (group) =>
          group.metricCode === 'land_and_soil' ||
          group.metricCode === 'corporate_footprint',
      ),
    [groupsInChapter],
  )
  const rightsRestGroups = useMemo(
    () =>
      groupsInChapter.filter(
        (group) => group.metricCode === RIGHTS_RISK_METRIC,
      ),
    [groupsInChapter],
  )

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
      <header className="tx-studio__header">
        <p className="tx-studio__eyebrow">P.R.O.O.F. · Product transparency</p>
        <div className="tx-studio__title-row">
          <h2 className="tx-studio__title">Disclosures</h2>
          <div className="tx-studio__stats">
            <span>
              <strong>{totals.published}</strong> published
            </span>
            <span>
              <strong>{totals.privateN}</strong> private
            </span>
            <span>
              <strong>{totals.untouched}</strong> not started
            </span>
          </div>
        </div>
        <p className="tx-studio__lede">
          Five chapters. Disclose what you know, with provenance. Unpublished stays private —
          publishing is what shoppers see.
        </p>
      </header>

      <div className="tx-shell">
        <nav className="tx-rail" aria-label="P.R.O.O.F. chapters">
          {PROOF_CHAPTERS.map((chapter) => {
            const progress = progressByChapter[chapter.id]
            const pct =
              progress.total === 0
                ? 0
                : Math.round((progress.published / progress.total) * 100)
            const active = chapter.id === activeChapter.id
            return (
              <button
                key={chapter.id}
                type="button"
                className={`tx-rail__btn${active ? ' tx-rail__btn--active' : ''}`}
                onClick={() => {
                  setChapterId(chapter.id)
                  setOpenKey(null)
                }}
                aria-current={active ? 'page' : undefined}
              >
                <span className="tx-rail__letter" aria-hidden>
                  {chapter.letter}
                </span>
                <span className="tx-rail__meta">
                  <span className="tx-rail__name">
                    {chapter.name}
                    {chapter.id === 'planet' && proofTabAskBadge(pcfAsk) > 0 ? (
                      <span className="tx-rail__ask">{proofTabAskBadge(pcfAsk)}</span>
                    ) : null}
                  </span>
                  <span className="tx-rail__progress">
                    {depthSummary(
                      chapter.id,
                      progressByChapter,
                      rowsByMetric,
                      pcfAsk,
                    )}
                  </span>
                  <span className="tx-rail__bar" aria-hidden>
                    <span style={{ width: `${pct}%` }} />
                  </span>
                </span>
              </button>
            )
          })}
        </nav>

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
          ) : activeChapter.id === 'rights' ? (
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
          ) : (
            <InventoryGroups {...inventoryProps} groups={groupsInChapter} />
          )}
        </div>
      </div>
    </div>
  )
}
