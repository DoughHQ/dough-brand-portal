/** Map Postgres HINT / message → operator-facing copy for prototype RPCs. */

const BY_HINT: Record<string, string> = {
  NAME_REQUIRED: 'Name the prototype.',
  CATEGORY_NOT_FOUND: 'That category no longer exists. Pick another.',
  IMAGE_PATH_INVALID: "One of the photos isn't in this brand's prototype folder. Re-upload it.",
  PROTOTYPE_NOT_FOUND: 'That prototype was removed or belongs to another brand.',
  PROTOTYPE_ARCHIVED: "This prototype is archived and can't be edited.",
  DECLARATION_REQUIRED: 'Declare both contains and may-contain (empty means none).',
  UNKNOWN_ALLERGEN: "One of the allergen codes isn't in Dough's vocabulary.",
  NOT_BRAND_EDITOR: 'You need product-edit access for this brand to change prototypes.',
}

export function humanizePrototypeError(error: {
  message?: string
  hint?: string | null
  code?: string
} | null | undefined): string {
  if (!error) return 'Something went wrong. Please try again.'
  const hint = (error.hint ?? '').trim()
  if (hint && BY_HINT[hint]) return BY_HINT[hint]

  const msg = (error.message ?? '').toLowerCase()
  if (msg.includes('not_brand_editor') || msg.includes('42501')) {
    return BY_HINT.NOT_BRAND_EDITOR
  }
  if (msg.includes('name the prototype')) return BY_HINT.NAME_REQUIRED
  if (msg.includes('archived')) return BY_HINT.PROTOTYPE_ARCHIVED
  if (msg.includes('image') && msg.includes('folder')) return BY_HINT.IMAGE_PATH_INVALID

  return error.message?.trim() || 'Something went wrong. Please try again.'
}
