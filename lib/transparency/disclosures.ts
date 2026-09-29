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

export type SaveDisclosureCode =
  | 'STALE_EDIT'
  | 'NOT_CURRENT'
  | 'NOT_ALLOWED_TO_PUBLISH'

export type SaveDisclosureResult =
  | { ok: true; disclosureId: number; changed: boolean }
  | { ok: false; error: string; code?: SaveDisclosureCode }

const STALE_RELOAD_MESSAGE = 'Updated elsewhere — reload to see the latest'

type RpcPayload = {
  error?: string
  changed?: boolean
  disclosure_id?: number
} | null

function mapRpcFailure(
  payload: RpcPayload,
  rpcError: { message?: string; hint?: string | null } | null,
): SaveDisclosureResult {
  const soft = payload?.error
  if (soft === 'STALE_EDIT' || soft === 'NOT_CURRENT') {
    return { ok: false, error: STALE_RELOAD_MESSAGE, code: soft }
  }

  const hint = rpcError?.hint
  if (hint === 'NOT_ALLOWED_TO_PUBLISH' || hint === 'CAPABILITY_REQUIRED') {
    return {
      ok: false,
      error: rpcError?.message?.trim() || 'Your role can’t publish disclosures.',
      code: 'NOT_ALLOWED_TO_PUBLISH',
    }
  }

  return {
    ok: false,
    error: rpcError?.message?.trim() || 'Save failed',
  }
}

function valuesCleared(draft: DisclosureDraft) {
  const cleared = draft.status !== 'disclosed'
  return {
    value_text: cleared ? null : draft.valueText,
    value_num: cleared ? null : draft.valueNum,
    value_bool: cleared ? null : draft.valueBool,
    value_date: cleared ? null : draft.valueDate,
    value_unit: cleared ? null : draft.valueUnit,
    method_code: cleared ? null : draft.methodCode,
    boundary_code: cleared ? null : draft.boundaryCode,
    data_quality: cleared ? null : draft.dataQuality,
    other_text: cleared ? null : draft.otherText,
    source_tier: (cleared ? 'brand_stated' : draft.sourceTier) as SourceTier,
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
  }
}

function isPublishOnly(prior: DisclosureDraft, draft: DisclosureDraft): boolean {
  return (
    prior.disclosureId != null &&
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
  )
}

/**
 * Value edits insert a new current row and demote the prior one (server txn).
 * Publish-only changes call set_product_disclosure_published.
 */
export async function saveDisclosure(args: {
  supabase: Client
  productId: number
  field: ProofSubMetricRow
  draft: DisclosureDraft
  prior: DisclosureDraft | null
}): Promise<SaveDisclosureResult> {
  const { supabase, productId, field, draft } = args
  const prior = args.prior

  const validation = clientValidate(field, draft)
  if (validation) return { ok: false, error: validation }

  if (prior && isPublishOnly(prior, draft) && prior.disclosureId != null) {
    const { data, error } = await supabase.rpc('set_product_disclosure_published', {
      p_disclosure_id: prior.disclosureId,
      p_published: draft.published,
    })
    const payload = data as RpcPayload
    if (error || payload?.error) return mapRpcFailure(payload, error)
    const id =
      typeof payload?.disclosure_id === 'number'
        ? payload.disclosure_id
        : prior.disclosureId
    return { ok: true, disclosureId: id, changed: payload?.changed !== false }
  }

  const values = valuesCleared(draft)
  const { data, error } = await supabase.rpc('save_product_disclosure', {
    p_product_id: productId,
    p_sub_metric_code: draft.subMetricCode,
    p_status: draft.status,
    p_source_tier: values.source_tier,
    p_subject_kind: draft.subjectKind,
    p_subject_label:
      draft.subjectKind === 'whole_product'
        ? null
        : draft.subjectLabel?.trim() || null,
    p_value_text: values.value_text,
    p_value_num: values.value_num,
    p_value_bool: values.value_bool,
    p_value_date: values.value_date,
    p_value_unit: values.value_unit,
    p_method_code: values.method_code,
    p_boundary_code: values.boundary_code,
    p_data_quality: values.data_quality,
    p_other_text: values.other_text,
    p_source_url: values.source_url,
    p_issuer_name: values.issuer_name,
    p_credential_id: values.credential_id,
    p_asof_date: draft.asofDate,
    p_published: draft.published,
    p_expected_current_id: prior?.disclosureId ?? null,
  })

  const payload = data as RpcPayload
  if (error || payload?.error) return mapRpcFailure(payload, error)
  if (typeof payload?.disclosure_id !== 'number') {
    return { ok: false, error: 'Save failed' }
  }
  return {
    ok: true,
    disclosureId: payload.disclosure_id,
    changed: payload.changed !== false,
  }
}
