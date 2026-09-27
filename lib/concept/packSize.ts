/**
 * Pack-size builder helpers.
 *
 * Domain phrases live in Postgres (pack_form_* + get_pack_size_options).
 * The published wire value remains a free string for {{pack_size}}.
 */

export const PACK_SIZE_OTHER = '__other__' as const

export type PackSizeOption = {
  phrase: string
  sort_order: number
  family_code: string
  family_label: string
  resolved_l2_node_id: number | null
  resolved_l2_node_code: string | null
}

/** Select value for the current pack_size string given the family's phrases. */
export function packSizeSelectValue(
  packSize: string,
  phrases: readonly string[]
): string {
  const trimmed = packSize.trim()
  if (!trimmed) return ''
  if (phrases.includes(trimmed)) return trimmed
  return PACK_SIZE_OTHER
}

/** True when a category change should wipe pack_size (phrase not in the new list). */
export function shouldClearPackSizeOnCategoryChange(
  packSize: string,
  nextPhrases: readonly string[]
): boolean {
  const trimmed = packSize.trim()
  if (!trimmed) return false
  return !nextPhrases.includes(trimmed)
}

/** Live preview of the price-expectation prompt with the token filled. */
export function packSizePromptPreview(packSize: string): string {
  const phrase = packSize.trim() || '…'
  return `What would you expect to pay for a ${phrase} of this?`
}
