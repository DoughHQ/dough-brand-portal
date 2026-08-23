/** Selectable session_templates codes for publish_study (pack_kind module | s2_module). */

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

/** Concept stimulus mode → operator-picked modules (engine + screener are automatic). */
export function conceptModulesForStimulusMode(
  mode: 'package' | 'price'
): StudyModuleCode[] {
  if (mode === 'price') return [MODULE_WILLINGNESS_TO_PAY]
  return [MODULE_PACKAGING]
}
