import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

type Client = SupabaseClient<Database>

export type DisclosureStatus =
  | 'disclosed'
  | 'not_disclosed'
  | 'not_applicable'
  | 'unknown'

export type SourceTier = 'brand_stated' | 'brand_document' | 'third_party_verified'

export type DisclosureDraft = {
  disclosureId: number | null
  subMetricCode: string
  subjectKind: string
  subjectLabel: string | null
  status: DisclosureStatus
  valueText: string | null
  valueNum: number | null
  valueBool: boolean | null
  valueDate: string | null
  valueUnit: string | null
  methodCode: string | null
  boundaryCode: string | null
  dataQuality: string | null
  otherText: string | null
  sourceTier: SourceTier
  sourceUrl: string | null
  issuerName: string | null
  credentialId: string | null
  asofDate: string
  published: boolean
}

export type ProofSubMetricRow = {
  sub_metric_code: string
  label: string
  definition: string
  value_kind: string
  allowed_values: string[] | null
  unit_source: string
  unit: string | null
  allowed_units: string[] | null
  requires_method: boolean
  allowed_methods: string[] | null
  requires_boundary: boolean
  allowed_boundaries: string[] | null
  requires_data_quality: boolean
  allowed_data_qualities: string[] | null
  subject_kind_default: string
  metric_code: string
  sort_order: number
}

export type ProofMetricRow = {
  metric_code: string
  label: string
  definition: string | null
  sort_order: number
}

function emptyValues() {
  return {
    valueText: null as string | null,
    valueNum: null as number | null,
    valueBool: null as boolean | null,
    valueDate: null as string | null,
    valueUnit: null as string | null,
    methodCode: null as string | null,
    boundaryCode: null as string | null,
    dataQuality: null as string | null,
    otherText: null as string | null,
  }
}

export function blankDraft(
  field: ProofSubMetricRow,
  overrides?: Partial<DisclosureDraft>,
): DisclosureDraft {
  return {
    disclosureId: null,
    subMetricCode: field.sub_metric_code,
    subjectKind: field.subject_kind_default,
    subjectLabel: field.subject_kind_default === 'whole_product' ? null : '',
    status: 'disclosed',
    ...emptyValues(),
    sourceTier: 'brand_stated',
    sourceUrl: null,
    issuerName: null,
    credentialId: null,
    asofDate: new Date().toISOString().slice(0, 10),
    published: false,
    ...overrides,
  }
}

export function draftFromRow(
  row: Database['public']['Tables']['product_disclosures']['Row'],
): DisclosureDraft {
  return {
    disclosureId: row.disclosure_id,
    subMetricCode: row.sub_metric_code,
    subjectKind: row.subject_kind,
    subjectLabel: row.subject_label,
    status: row.status as DisclosureStatus,
    valueText: row.value_text,
    valueNum: row.value_num == null ? null : Number(row.value_num),
    valueBool: row.value_bool,
    valueDate: row.value_date,
    valueUnit: row.value_unit,
    methodCode: row.method_code,
    boundaryCode: row.boundary_code,
    dataQuality: row.data_quality,
    otherText: row.other_text,
    sourceTier: row.source_tier as SourceTier,
    sourceUrl: row.source_url,
    issuerName: row.issuer_name,
    credentialId: row.credential_id,
    asofDate: row.asof_date ?? new Date().toISOString().slice(0, 10),
    published: row.published,
  }
}

export function clientValidate(
  field: ProofSubMetricRow,
  draft: DisclosureDraft,
): string | null {
  if (!draft.asofDate) return 'As-of date is required.'

  if (field.subject_kind_default !== 'whole_product') {
    if (!draft.subjectLabel?.trim()) {
      return 'Name the subject (ingredient, component, facility, or date type).'
    }
  }

  if (draft.status !== 'disclosed') {
    return null
  }

  if (draft.sourceTier !== 'brand_stated' && !draft.sourceUrl?.trim()) {
    return 'Source URL is required unless the tier is brand stated.'
  }
  if (draft.sourceTier === 'third_party_verified' && !draft.issuerName?.trim()) {
    return 'Issuer name is required for third-party verified disclosures.'
  }

  switch (field.value_kind) {
    case 'numeric':
      if (draft.valueNum == null || Number.isNaN(draft.valueNum)) {
        return `${field.label} requires a number.`
      }
      if (field.unit_source === 'row' && !draft.valueUnit) {
        return `${field.label} requires a unit.`
      }
      break
    case 'date':
      if (!draft.valueDate) return `${field.label} requires a date.`
      break
    case 'bool':
      if (draft.valueBool == null) return `${field.label} requires a yes/no.`
      break
    case 'enum':
    case 'text':
    case 'url':
    default:
      if (!draft.valueText?.trim()) return `${field.label} requires a value.`
      if (draft.valueText === 'other' && !draft.otherText?.trim()) {
        return 'Describe what “other” means.'
      }
      break
  }

  if (field.requires_method && !draft.methodCode) {
    return `${field.label} requires a method.`
  }
  if (field.requires_boundary && !draft.boundaryCode) {
    return `${field.label} requires a boundary.`
  }
  if (field.requires_data_quality && !draft.dataQuality) {
    return `${field.label} requires a data quality.`
  }

  return null
}

/**
 * Value edits insert a new current row and demote the prior one.
 * Publish-only changes update `published` in place (not a value correction).
 */
export async function saveDisclosure(args: {
  supabase: Client
  productId: number
  brandId: number
  field: ProofSubMetricRow
  draft: DisclosureDraft
  prior: DisclosureDraft | null
}): Promise<{ ok: true; disclosureId: number } | { ok: false; error: string }> {
  const { supabase, productId, brandId, field, draft } = args
  const prior = args.prior

  const validation = clientValidate(field, draft)
  if (validation) return { ok: false, error: validation }

  const publishOnly =
    prior?.disclosureId != null &&
    prior.status === draft.status &&
    prior.subjectKind === draft.subjectKind &&
    (prior.subjectLabel ?? '') === (draft.subjectLabel ?? '') &&
    prior.valueText === draft.valueText &&
    prior.valueNum === draft.valueNum &&
    prior.valueBool === draft.valueBool &&
    prior.valueDate === draft.valueDate &&
    prior.valueUnit === draft.valueUnit &&
    prior.methodCode === draft.methodCode &&
    prior.boundaryCode === draft.boundaryCode &&
    prior.dataQuality === draft.dataQuality &&
    prior.otherText === draft.otherText &&
    prior.sourceTier === draft.sourceTier &&
    prior.sourceUrl === draft.sourceUrl &&
    prior.issuerName === draft.issuerName &&
    prior.credentialId === draft.credentialId &&
    prior.asofDate === draft.asofDate &&
    prior.published !== draft.published

  if (publishOnly && prior?.disclosureId != null) {
    const { error } = await supabase
      .from('product_disclosures')
      .update({ published: draft.published })
      .eq('disclosure_id', prior.disclosureId)
    if (error) return { ok: false, error: error.message }
    return { ok: true, disclosureId: prior.disclosureId }
  }

  const cleared = draft.status !== 'disclosed'
  const insertRow = {
    product_id: productId,
    brand_id: brandId,
    sub_metric_code: draft.subMetricCode,
    // Trigger overwrites from registry version.
    sub_metric_version: 0,
    subject_kind: draft.subjectKind,
    subject_label:
      draft.subjectKind === 'whole_product'
        ? null
        : draft.subjectLabel?.trim() || null,
    status: draft.status,
    value_text: cleared ? null : draft.valueText,
    value_num: cleared ? null : draft.valueNum,
    value_bool: cleared ? null : draft.valueBool,
    value_date: cleared ? null : draft.valueDate,
    value_unit: cleared ? null : draft.valueUnit,
    method_code: cleared ? null : draft.methodCode,
    boundary_code: cleared ? null : draft.boundaryCode,
    data_quality: cleared ? null : draft.dataQuality,
    other_text: cleared ? null : draft.otherText,
    source_tier: cleared ? 'brand_stated' : draft.sourceTier,
    source_url: cleared
      ? null
      : draft.sourceTier === 'brand_stated'
        ? null
        : draft.sourceUrl?.trim() || null,
    issuer_name: cleared
      ? null
      : draft.sourceTier === 'third_party_verified'
        ? draft.issuerName?.trim() || null
        : null,
    credential_id: cleared
      ? null
      : draft.sourceTier === 'third_party_verified'
        ? draft.credentialId?.trim() || null
        : null,
    asof_date: draft.asofDate,
    published: draft.published,
    is_current: true,
  }

  if (prior?.disclosureId != null) {
    const { error: demoteError } = await supabase
      .from('product_disclosures')
      .update({ is_current: false })
      .eq('disclosure_id', prior.disclosureId)
    if (demoteError) return { ok: false, error: demoteError.message }
  }

  const { data: inserted, error: insertError } = await supabase
    .from('product_disclosures')
    .insert(insertRow)
    .select('disclosure_id')
    .single()

  if (insertError || !inserted) {
    // Best-effort restore if demote succeeded and insert failed.
    if (prior?.disclosureId != null) {
      await supabase
        .from('product_disclosures')
        .update({ is_current: true })
        .eq('disclosure_id', prior.disclosureId)
    }
    return { ok: false, error: insertError?.message ?? 'Insert failed' }
  }

  if (prior?.disclosureId != null) {
    await supabase
      .from('product_disclosures')
      .update({ superseded_by: inserted.disclosure_id })
      .eq('disclosure_id', prior.disclosureId)
  }

  return { ok: true, disclosureId: inserted.disclosure_id }
}
