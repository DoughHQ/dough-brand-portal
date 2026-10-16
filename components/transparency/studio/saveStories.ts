import type { Dispatch, SetStateAction } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'
import {
  clientValidate,
  saveDisclosure,
  type DisclosureDraft,
  type ProofSubMetricRow,
} from '@/lib/transparency/disclosures'
import { ORIGIN_DEPTH_CODES } from '@/components/transparency/OriginSheet'
import type { LocalRow, RowsByMetric } from './types'

type SaveStoryDeps = {
  supabase: SupabaseClient<Database>
  productId: number
  fields: ProofSubMetricRow[]
  rowsByMetric: RowsByMetric
  load: () => void
  setStoryError: Dispatch<SetStateAction<string | null>>
  setSavingKey: Dispatch<SetStateAction<string | null>>
  setWriteBlocked: Dispatch<SetStateAction<boolean>>
  setRowsByMetric: Dispatch<SetStateAction<RowsByMetric>>
}

export async function saveOriginStory(deps: SaveStoryDeps, subject: string) {
  const {
    supabase,
    productId,
    fields,
    rowsByMetric,
    load,
    setStoryError,
    setSavingKey,
    setWriteBlocked,
    setRowsByMetric,
  } = deps
  setStoryError(null)
  const subjectNorm = subject.trim().toLowerCase().replace(/\s+/g, ' ')
  setSavingKey(subjectNorm)

  const findRow = (code: string) =>
    (rowsByMetric[code] ?? []).find(
      (row) =>
        (row.draft.subjectLabel ?? '')
          .trim()
          .toLowerCase()
          .replace(/\s+/g, ' ') === subjectNorm,
    )

  const anchor =
    findRow('origin_country')?.draft ??
    findRow('origin_region')?.draft ??
    findRow('origin_producer_name')?.draft ??
    findRow('origin_geolocation')?.draft ??
    null

  if (!anchor) {
    setStoryError('Add a country, region, or producer before saving.')
    setSavingKey(null)
    return
  }

  const shared = {
    sourceTier: anchor.sourceTier,
    sourceUrl: anchor.sourceUrl,
    issuerName: anchor.issuerName,
    credentialId: anchor.credentialId,
    asofDate: anchor.asofDate,
    published: anchor.published,
    subjectKind: 'ingredient' as const,
    subjectLabel: subject.trim(),
    status: 'disclosed' as const,
  }
  const queue: {
    field: ProofSubMetricRow
    row: LocalRow
    draft: DisclosureDraft
  }[] = []
  for (const code of ORIGIN_DEPTH_CODES) {
    const field = fields.find((candidate) => candidate.sub_metric_code === code)
    if (!field) continue
    const row = findRow(code)
    if (!row) continue
    const draft: DisclosureDraft = { ...row.draft, ...shared }
    if (!draft.valueText?.trim()) continue
    queue.push({ field, row, draft })
  }

  if (queue.length === 0) {
    setStoryError('Add at least a country before saving.')
    setSavingKey(null)
    return
  }

  for (const item of queue) {
    const error = clientValidate(item.field, item.draft)
    if (error) {
      setStoryError(error)
      setSavingKey(null)
      return
    }
  }

  const applied: {
    code: string
    oldKey: string
    nextKey: string
    draft: DisclosureDraft
  }[] = []
  for (const item of queue) {
    const result = await saveDisclosure({
      supabase,
      productId,
      field: item.field,
      draft: item.draft,
      prior: item.row.saved,
    })
    if (!result.ok) {
      setStoryError(result.error)
      if (result.code === 'STALE_EDIT' || result.code === 'NOT_CURRENT') {
        void load()
      }
      if (result.code === 'NOT_ALLOWED_TO_PUBLISH') {
        setWriteBlocked(true)
      }
      break
    }
    applied.push({
      code: item.field.sub_metric_code,
      oldKey: item.row.key,
      nextKey: `saved-${result.disclosureId}`,
      draft: { ...item.draft, disclosureId: result.disclosureId },
    })
  }

  if (applied.length > 0) {
    setRowsByMetric((prev) => {
      const next = { ...prev }
      for (const update of applied) {
        next[update.code] = (next[update.code] ?? []).map((row) =>
          row.key === update.oldKey
            ? {
                key: update.nextKey,
                draft: update.draft,
                saved: update.draft,
              }
            : row,
        )
      }
      return next
    })
  }
  setSavingKey(null)
}

export async function saveDisclosureBundle(
  deps: SaveStoryDeps,
  codes: readonly string[],
  bundleKey: string,
) {
  const {
    supabase,
    productId,
    fields,
    rowsByMetric,
    load,
    setStoryError,
    setSavingKey,
    setWriteBlocked,
    setRowsByMetric,
  } = deps
  setStoryError(null)
  setSavingKey(bundleKey)

  const items: {
    field: ProofSubMetricRow
    row: LocalRow
    draft: DisclosureDraft
  }[] = []
  let anchor: DisclosureDraft | null = null
  for (const code of codes) {
    const field = fields.find((candidate) => candidate.sub_metric_code === code)
    const row = (rowsByMetric[code] ?? [])[0]
    if (!field || !row) continue
    if (!anchor) anchor = row.draft
    const hasValue =
      Boolean(row.draft.valueText?.trim()) || row.draft.valueNum != null
    if (!hasValue) continue
    items.push({ field, row, draft: row.draft })
  }

  if (items.length === 0 || !anchor) {
    setStoryError('Add at least one value before saving.')
    setSavingKey(null)
    return
  }

  const shared = {
    sourceTier: anchor.sourceTier,
    sourceUrl: anchor.sourceUrl,
    issuerName: anchor.issuerName,
    credentialId: anchor.credentialId,
    asofDate: anchor.asofDate,
    published: anchor.published,
    status: 'disclosed' as const,
  }
  const queue = items.map((item) => ({
    ...item,
    draft: { ...item.draft, ...shared },
  }))

  for (const item of queue) {
    const error = clientValidate(item.field, item.draft)
    if (error) {
      setStoryError(error)
      setSavingKey(null)
      return
    }
  }

  const applied: {
    code: string
    oldKey: string
    nextKey: string
    draft: DisclosureDraft
  }[] = []
  for (const item of queue) {
    const result = await saveDisclosure({
      supabase,
      productId,
      field: item.field,
      draft: item.draft,
      prior: item.row.saved,
    })
    if (!result.ok) {
      setStoryError(result.error)
      if (result.code === 'STALE_EDIT' || result.code === 'NOT_CURRENT') {
        void load()
      }
      if (result.code === 'NOT_ALLOWED_TO_PUBLISH') {
        setWriteBlocked(true)
      }
      break
    }
    applied.push({
      code: item.field.sub_metric_code,
      oldKey: item.row.key,
      nextKey: `saved-${result.disclosureId}`,
      draft: { ...item.draft, disclosureId: result.disclosureId },
    })
  }

  if (applied.length > 0) {
    setRowsByMetric((prev) => {
      const next = { ...prev }
      for (const update of applied) {
        next[update.code] = (next[update.code] ?? []).map((row) =>
          row.key === update.oldKey
            ? {
                key: update.nextKey,
                draft: update.draft,
                saved: update.draft,
              }
            : row,
        )
      }
      return next
    })
  }
  setSavingKey(null)
}
