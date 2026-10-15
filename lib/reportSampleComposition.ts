export type SampleCompositionCell = {
  key: string
  n: number
  share: number | null
  reportable: boolean
  withheld_reason: string | null
}

export type SampleComposition = {
  version: number
  cohort: string
  n_in_cohort: number
  n_with_age: number
  n_missing_age: number
  k_floor: number
  age_bands: SampleCompositionCell[]
  brand_familiarity: SampleCompositionCell[] | null
  definitions: Record<string, string>
}

function asObject(raw: unknown): Record<string, unknown> | null {
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) return null
  return raw as Record<string, unknown>
}

function asNumber(raw: unknown): number | null {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw
  if (typeof raw === 'string' && raw.trim() !== '' && Number.isFinite(Number(raw))) {
    return Number(raw)
  }
  return null
}

function parseCells(raw: unknown, keyName: 'band' | 'segment'): SampleCompositionCell[] {
  if (!Array.isArray(raw)) return []

  const cells: SampleCompositionCell[] = []
  for (const item of raw) {
    const row = asObject(item)
    if (!row || typeof row[keyName] !== 'string') continue
    const key = row[keyName].trim()
    const n = asNumber(row.n)
    if (!key || n == null) continue
    cells.push({
      key,
      n,
      share: asNumber(row.share),
      reportable: row.reportable === true,
      withheld_reason:
        typeof row.withheld_reason === 'string' && row.withheld_reason.trim()
          ? row.withheld_reason
          : null,
    })
  }
  return cells
}

export function parseSampleComposition(raw: unknown): SampleComposition | null {
  const value = asObject(raw)
  if (!value) return null

  const nInCohort = asNumber(value.n_in_cohort)
  const kFloor = asNumber(value.k_floor)
  if (nInCohort == null || kFloor == null) return null

  const definitions: Record<string, string> = {}
  for (const [key, definition] of Object.entries(asObject(value.definitions) ?? {})) {
    if (typeof definition === 'string' && definition.trim()) {
      definitions[key] = definition
    }
  }

  return {
    version: asNumber(value.version) ?? 1,
    cohort:
      typeof value.cohort === 'string' && value.cohort.trim()
        ? value.cohort
        : 'completers',
    n_in_cohort: nInCohort,
    n_with_age: asNumber(value.n_with_age) ?? 0,
    n_missing_age: asNumber(value.n_missing_age) ?? 0,
    k_floor: kFloor,
    age_bands: parseCells(value.age_bands, 'band'),
    brand_familiarity:
      value.brand_familiarity == null
        ? null
        : parseCells(value.brand_familiarity, 'segment'),
    definitions,
  }
}

export function sampleCompositionLabel(key: string): string {
  switch (key) {
    case 'existing_purchaser':
      return 'Already bought or used'
    case 'aware_not_purchased':
      return 'Aware, not purchased'
    case 'new_to_brand':
      return 'New to the brand'
    default:
      return key.replace(/_/g, ' ')
  }
}
