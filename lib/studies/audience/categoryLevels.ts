/**
 * Completed-loop thresholds for category levels 1–20.
 * Mirrors public.category_level_thresholds (immutable reference table).
 */
export const CATEGORY_LEVEL_TRIES: Record<number, number> = {
  1: 1,
  2: 3,
  3: 5,
  4: 8,
  5: 11,
  6: 16,
  7: 22,
  8: 29,
  9: 38,
  10: 50,
  11: 64,
  12: 82,
  13: 105,
  14: 132,
  15: 166,
  16: 208,
  17: 260,
  18: 323,
  19: 400,
  20: 495,
}

export function loopsForCategoryLevel(level: number): number | null {
  if (!Number.isInteger(level) || level < 1 || level > 20) return null
  return CATEGORY_LEVEL_TRIES[level] ?? null
}

export function categoryLevelLoopCopy(
  level: number | null,
  categoryName?: string | null
): string {
  const loops = level != null ? loopsForCategoryLevel(level) : null
  if (loops == null) {
    return '1–20. We’ll show how many completed loops that takes.'
  }
  const loopWord = loops === 1 ? 'loop' : 'loops'
  const where = categoryName?.trim() ? ` in ${categoryName.trim()}` : ''
  return `Level ${level} = ${loops} completed ${loopWord}${where}`
}
