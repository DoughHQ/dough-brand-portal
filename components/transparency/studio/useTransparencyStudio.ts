'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase'
import {
  blankDraft,
  clientValidate,
  draftFromRow,
  saveDisclosure,
  type DisclosureDraft,
  type ProofMetricRow,
  type ProofSubMetricRow,
} from '@/lib/transparency/disclosures'
import type { LocalRow, RowsByMetric } from './types'
import { saveDisclosureBundle, saveOriginStory } from './saveStories'

type UseTransparencyStudioInput = {
  productId: number
  canEdit: boolean
}

export default function useTransparencyStudio({
  productId,
  canEdit: canEditProp,
}: UseTransparencyStudioInput) {
  const supabase = useMemo(() => createClient(), [])
  const [fields, setFields] = useState<ProofSubMetricRow[]>([])
  const [metrics, setMetrics] = useState<ProofMetricRow[]>([])
  const [rowsByMetric, setRowsByMetric] = useState<RowsByMetric>({})
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [storyError, setStoryError] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loadVersion, setLoadVersion] = useState(0)
  /** Demoted when the server reports a viewer tried to publish. */
  const [writeBlocked, setWriteBlocked] = useState(false)
  const canEdit = canEditProp && !writeBlocked

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    const [fieldsRes, metricsRes, rowsRes] = await Promise.all([
      supabase
        .from('proof_sub_metrics')
        .select(
          'sub_metric_code, label, definition, value_kind, allowed_values, unit_source, unit, allowed_units, requires_method, allowed_methods, requires_boundary, allowed_boundaries, requires_data_quality, allowed_data_qualities, subject_kind_default, metric_code, sort_order',
        )
        .eq('level', 'product')
        .eq('is_active', true)
        .order('sort_order'),
      supabase
        .from('proof_metrics')
        .select('metric_code, label, definition, sort_order')
        .eq('is_active', true)
        .order('sort_order'),
      supabase
        .from('product_disclosures')
        .select('*')
        .eq('product_id', productId)
        .eq('is_current', true),
    ])

    if (fieldsRes.error || metricsRes.error || rowsRes.error) {
      setLoadError(
        fieldsRes.error?.message ??
          metricsRes.error?.message ??
          rowsRes.error?.message ??
          'Failed to load',
      )
      setLoading(false)
      return
    }

    const fieldList = (fieldsRes.data ?? []) as ProofSubMetricRow[]
    setFields(fieldList)
    setMetrics((metricsRes.data ?? []) as ProofMetricRow[])

    const byCode: RowsByMetric = {}
    for (const field of fieldList) {
      byCode[field.sub_metric_code] = []
    }
    for (const row of rowsRes.data ?? []) {
      const draft = draftFromRow(row)
      const list = byCode[draft.subMetricCode] ?? (byCode[draft.subMetricCode] = [])
      list.push({
        key: `saved-${row.disclosure_id}`,
        draft,
        saved: draft,
      })
    }
    for (const field of fieldList) {
      // Subject-required fields are seeded from context (e.g. Formula from the label).
      if (field.subject_kind_default !== 'whole_product') continue
      if ((byCode[field.sub_metric_code] ?? []).length === 0) {
        byCode[field.sub_metric_code] = [
          {
            key: `blank-${field.sub_metric_code}`,
            draft: blankDraft(field),
            saved: null,
          },
        ]
      }
    }
    setRowsByMetric(byCode)
    setLoadVersion((version) => version + 1)
    setLoading(false)
  }, [productId, supabase])

  useEffect(() => {
    void load()
  }, [load])

  const updateRow = (
    subMetricCode: string,
    key: string,
    draft: DisclosureDraft,
  ) => {
    setRowsByMetric((prev) => {
      const list = prev[subMetricCode] ?? []
      const index = list.findIndex((row) => row.key === key)
      if (index >= 0) {
        return {
          ...prev,
          [subMetricCode]: list.map((row) =>
            row.key === key ? { ...row, draft } : row,
          ),
        }
      }
      return {
        ...prev,
        [subMetricCode]: [...list, { key, draft, saved: null }],
      }
    })
    setErrors((current) => {
      const next = { ...current }
      delete next[key]
      return next
    })
  }

  const ensureSubjectRow = (
    field: ProofSubMetricRow,
    subjectLabel: string,
  ): string => {
    const normalized = subjectLabel.trim().toLowerCase().replace(/\s+/g, ' ')
    const existing = (rowsByMetric[field.sub_metric_code] ?? []).find(
      (row) =>
        (row.draft.subjectLabel ?? '')
          .trim()
          .toLowerCase()
          .replace(/\s+/g, ' ') === normalized,
    )
    if (existing) return existing.key
    const key = `draft-${field.sub_metric_code}-${normalized.replace(/[^a-z0-9]+/g, '-')}`
    const draft = blankDraft(field, {
      subjectKind: field.subject_kind_default,
      subjectLabel: subjectLabel.trim(),
      status: 'disclosed',
    })
    setRowsByMetric((prev) => ({
      ...prev,
      [field.sub_metric_code]: [
        ...(prev[field.sub_metric_code] ?? []),
        { key, draft, saved: null },
      ],
    }))
    return key
  }

  const addCustomIngredient = (name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    const percentage = fields.find(
      (field) => field.sub_metric_code === 'ingredient_percentage',
    )
    if (percentage) ensureSubjectRow(percentage, trimmed)
    const country = fields.find(
      (field) => field.sub_metric_code === 'origin_country',
    )
    if (country) ensureSubjectRow(country, trimmed)
  }

  const addSubjectRow = (field: ProofSubMetricRow): string => {
    const key = `new-${field.sub_metric_code}-${Date.now()}`
    setRowsByMetric((prev) => ({
      ...prev,
      [field.sub_metric_code]: [
        ...(prev[field.sub_metric_code] ?? []),
        { key, draft: blankDraft(field), saved: null },
      ],
    }))
    return key
  }

  const handleSave = async (field: ProofSubMetricRow, row: LocalRow) => {
    const error = clientValidate(field, row.draft)
    if (error) {
      setErrors((current) => ({ ...current, [row.key]: error }))
      return
    }
    setSavingKey(row.key)
    const result = await saveDisclosure({
      supabase,
      productId,
      field,
      draft: row.draft,
      prior: row.saved,
    })
    setSavingKey(null)
    if (!result.ok) {
      setErrors((current) => ({ ...current, [row.key]: result.error }))
      if (result.code === 'STALE_EDIT' || result.code === 'NOT_CURRENT') {
        void load()
      }
      if (result.code === 'NOT_ALLOWED_TO_PUBLISH') {
        setWriteBlocked(true)
      }
      if (process.env.NODE_ENV === 'development') {
        console.error('[transparency] save failed', result.error)
      }
      return
    }
    const nextDraft: DisclosureDraft = {
      ...row.draft,
      disclosureId: result.disclosureId,
    }
    const nextKey = `saved-${result.disclosureId}`
    setRowsByMetric((prev) => ({
      ...prev,
      [field.sub_metric_code]: (prev[field.sub_metric_code] ?? []).map(
        (current) =>
          current.key === row.key
            ? { key: nextKey, draft: nextDraft, saved: nextDraft }
            : current,
      ),
    }))
    return nextKey
  }

  const saveDeps = {
    supabase,
    productId,
    fields,
    rowsByMetric,
    load,
    setStoryError,
    setSavingKey,
    setWriteBlocked,
    setRowsByMetric,
  }

  const handleSaveOriginStory = (subject: string) =>
    saveOriginStory(saveDeps, subject)

  const handleSaveBundle = (codes: readonly string[], bundleKey: string) =>
    saveDisclosureBundle(saveDeps, codes, bundleKey)

  return {
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
  }
}
