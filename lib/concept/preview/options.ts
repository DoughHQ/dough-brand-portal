import type { ConceptOption, ConceptScreenConfig } from './planTypes'

export type NormalizedOption = {
  key: string
  label: string
  low?: number | null
  high?: number | null
}

export function normalizeOptions(config: ConceptScreenConfig | undefined): NormalizedOption[] {
  const raw = config?.options
  if (!Array.isArray(raw)) return []
  return raw.map((item, i) => {
    if (typeof item === 'string') {
      return { key: item, label: item }
    }
    const key = item.id ?? item.value ?? item.label ?? `opt_${i}`
    return {
      key,
      label: item.label || item.value || item.id || `Option ${i + 1}`,
      low: item.low,
      high: item.high,
    }
  })
}

export function optionLabel(opt: ConceptOption | string): string {
  return typeof opt === 'string' ? opt : opt.label
}
