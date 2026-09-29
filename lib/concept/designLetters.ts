/**
 * Respondent-facing design letters — same rule as the server.
 * Letter = 1-based position in p_field.concepts (A = first arm).
 */

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

/** "Design A" for concepts[0], "Design B" for concepts[1], … */
export function respondentDesignLabel(conceptIndex: number): string {
  if (!Number.isFinite(conceptIndex) || conceptIndex < 0) return 'Design ?'
  if (conceptIndex < LETTERS.length) {
    return `Design ${LETTERS[conceptIndex]!}`
  }
  return `Design ${conceptIndex + 1}`
}

/** Map brand arm_label / display_name → respondent letter via publish concept order. */
export function respondentLabelForArm(
  concepts: ReadonlyArray<{ arm_label?: string; display_name?: string }>,
  arm: { arm_label?: string | null; display_name?: string | null }
): string {
  const armLabel = (arm.arm_label ?? '').trim()
  const display = (arm.display_name ?? '').trim()
  const idx = concepts.findIndex((c) => {
    const cArm = (c.arm_label ?? '').trim()
    const cName = (c.display_name ?? '').trim()
    if (armLabel && cArm && armLabel === cArm) return true
    if (display && cName && display === cName) return true
    if (armLabel && cName && armLabel === cName) return true
    if (display && cArm && display === cArm) return true
    return false
  })
  return respondentDesignLabel(idx >= 0 ? idx : 0)
}

/** Brand-facing strings that must never appear in the phone mock. */
export function isBrandFacingDesignLabel(text: string): boolean {
  const t = text.trim().toLowerCase()
  if (!t) return false
  if (/^design\s+[a-z0-9]+$/i.test(text.trim())) return false
  return true
}
