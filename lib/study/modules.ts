/**
 * Selectable session_templates codes for publish_study
 * (pack_kind module | s2_module).
 *
 * Engine / screener packs (ENGINE_BATTLE, SCREENER_CATEGORY) are automatic
 * and never appear here. Packaging + WTP are derived from stimulus mode —
 * they are not pickable. The picker only offers config-free add-ons.
 */

export const MODULE_PACKAGING = 'MODULE_PACKAGING'
export const MODULE_WILLINGNESS_TO_PAY = 'MODULE_WILLINGNESS_TO_PAY'
export const MODULE_VALUE = 'MODULE_VALUE'
export const MODULE_FIELD_RANKING = 'MODULE_FIELD_RANKING'
/** iHUT-only — selecting this makes the study 2-session. */
export const MODULE_LOYALTY = 'MODULE_LOYALTY'

export type StudyModuleCode =
  | typeof MODULE_PACKAGING
  | typeof MODULE_WILLINGNESS_TO_PAY
  | typeof MODULE_VALUE
  | typeof MODULE_FIELD_RANKING
  | typeof MODULE_LOYALTY

export type StudyTestType = 'concept' | 'ihut'

export type PickableModuleDef = {
  code: StudyModuleCode
  label: string
  description: string
  testTypes: readonly StudyTestType[]
}

/**
 * Operator-pickable, config-free modules. Labels/descriptions are the
 * picker source of truth. Do not add ENGINE_* / SCREENER_* here.
 */
export const PICKABLE_MODULES: readonly PickableModuleDef[] = [
  {
    code: MODULE_VALUE,
    label: 'Purchase drivers',
    description:
      'MaxDiff — which attributes actually drive the buy, ranked by what people trade off.',
    testTypes: ['concept', 'ihut'],
  },
  {
    code: MODULE_FIELD_RANKING,
    label: 'Field ranking',
    description:
      'Forced-rank every product in the field — a full order, not just pairwise battles.',
    testTypes: ['concept', 'ihut'],
  },
  {
    code: MODULE_LOYALTY,
    label: 'Loyalty follow-up',
    description:
      'A second session after they live with the product — did preference hold, or drift?',
    testTypes: ['ihut'],
  },
]

const PICKABLE_CODE_SET = new Set<string>(PICKABLE_MODULES.map((m) => m.code))

export function pickableModulesFor(testType: StudyTestType): PickableModuleDef[] {
  return PICKABLE_MODULES.filter((m) => m.testTypes.includes(testType))
}

export function isPickableModuleCode(value: unknown): value is StudyModuleCode {
  return typeof value === 'string' && PICKABLE_CODE_SET.has(value)
}

/** Deduped, type-filtered extras. Drops derived/engine codes and loyalty on concept. */
export function sanitizeSelectedModules(
  raw: unknown,
  testType: StudyTestType
): StudyModuleCode[] {
  if (!Array.isArray(raw)) return []
  const allowed = new Set(pickableModulesFor(testType).map((m) => m.code))
  const out: StudyModuleCode[] = []
  for (const item of raw) {
    if (!isPickableModuleCode(item) || !allowed.has(item)) continue
    if (out.includes(item)) continue
    out.push(item)
  }
  return out
}

export function hasLoyaltyModule(
  modules: readonly string[] | null | undefined
): boolean {
  return Array.isArray(modules) && modules.includes(MODULE_LOYALTY)
}

/** Concept stimulus mode → derived base module (engine + screener are automatic). */
export function conceptModulesForStimulusMode(
  mode: 'package' | 'price'
): StudyModuleCode[] {
  if (mode === 'price') return [MODULE_WILLINGNESS_TO_PAY]
  return [MODULE_PACKAGING]
}

/** Derived base first, then sanitized extras. Loyalty can never appear. */
export function composeConceptPublishModules(
  mode: 'package' | 'price',
  selected: readonly string[] | null | undefined
): StudyModuleCode[] {
  const base = conceptModulesForStimulusMode(mode)
  const extras = sanitizeSelectedModules(selected, 'concept')
  const seen = new Set<StudyModuleCode>(base)
  const out = [...base]
  for (const code of extras) {
    if (seen.has(code)) continue
    seen.add(code)
    out.push(code)
  }
  return out
}

export function composeBoxPublishModules(
  selected: readonly string[] | null | undefined
): StudyModuleCode[] {
  return sanitizeSelectedModules(selected, 'ihut')
}

/**
 * iHUT extras + legacy loyaltyFollowUp. Old drafts only had the boolean;
 * newer drafts store loyalty in selectedModules. One resolver for publish,
 * validity, and draft migrate.
 */
export function resolveBoxSelectedModules(draft: {
  selectedModules?: unknown
  loyaltyFollowUp?: boolean
}): StudyModuleCode[] {
  const modules = sanitizeSelectedModules(draft.selectedModules, 'ihut')
  if (draft.loyaltyFollowUp === true && !modules.includes(MODULE_LOYALTY)) {
    return [...modules, MODULE_LOYALTY]
  }
  return modules
}
