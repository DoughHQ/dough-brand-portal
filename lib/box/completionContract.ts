export const IHUT_COMPLETION_OVERAGE_PERCENT = 10
export const IHUT_RESPONDENT_WINDOW_DAYS = 14
export const IHUT_RESPONDENT_WINDOW_MIN_DAYS = 7
export const IHUT_HIDDEN_BACKSTOP_DAYS = 90
/** Largest target whose target + rounded 10% overage fits Postgres int4. */
export const IHUT_MAX_TARGET_COMPLETIONS = 1_952_257_860

export type IhutInventoryPlan = {
  targetCompletions: number
  overagePercent: number
  overageUnits: number
  physicalUnits: number
}

export function ihutHiddenBackstopAt(now = new Date()): string {
  return new Date(
    now.getTime() + IHUT_HIDDEN_BACKSTOP_DAYS * 24 * 60 * 60 * 1000
  ).toISOString()
}

/** Server mirrors this calculation and remains authoritative at publish. */
export function ihutInventoryPlan(
  targetCompletions: number | null | undefined
): IhutInventoryPlan | null {
  if (
    typeof targetCompletions !== 'number' ||
    !Number.isSafeInteger(targetCompletions) ||
    targetCompletions < 1 ||
    targetCompletions > IHUT_MAX_TARGET_COMPLETIONS
  ) {
    return null
  }

  const overageUnits = Math.ceil(
    (targetCompletions * IHUT_COMPLETION_OVERAGE_PERCENT) / 100
  )
  return {
    targetCompletions,
    overagePercent: IHUT_COMPLETION_OVERAGE_PERCENT,
    overageUnits,
    physicalUnits: targetCompletions + overageUnits,
  }
}
