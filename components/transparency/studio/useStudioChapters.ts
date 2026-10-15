import { useEffect, useMemo, useState } from 'react'
import { RIGHTS_RISK_METRIC } from '@/components/transparency/RightsSheet'
import type { ProofMetricRow, ProofSubMetricRow } from '@/lib/transparency/disclosures'
import {
  PROOF_CHAPTERS,
  type ProofChapterId,
} from '@/lib/transparency/proofChapters'
import {
  buildFieldsByChapter,
  calculateProgressByChapter,
  calculateTotals,
  selectDefaultChapter,
} from './progress'
import type { InventoryGroup, RowsByMetric } from './types'

function indexFields(
  fields: ProofSubMetricRow[],
): Record<string, ProofSubMetricRow | undefined> {
  const byCode: Record<string, ProofSubMetricRow | undefined> = {}
  for (const field of fields) byCode[field.sub_metric_code] = field
  return byCode
}

type UseStudioChaptersInput = {
  fields: ProofSubMetricRow[]
  metrics: ProofMetricRow[]
  rowsByMetric: RowsByMetric
  loading: boolean
  loadVersion: number
  ingredientStatement: string | null
}

export type StudioChaptersState = ReturnType<typeof useStudioChapters>

export default function useStudioChapters({
  fields,
  metrics,
  rowsByMetric,
  loading,
  loadVersion,
  ingredientStatement,
}: UseStudioChaptersInput) {
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

  return {
    setChapterId,
    openKey,
    setOpenKey,
    fieldsByChapter,
    progressByChapter,
    totals,
    activeChapter,
    chapterFields,
    groupsInChapter,
    originFieldsByCode,
    operationsFieldsByCode,
    planetFieldsByCode,
    rightsFieldsByCode,
    journeyGroups,
    planetRestGroups,
    rightsRestGroups,
  }
}
