/** Portal support contact — used for locked fields and stubbed write paths. */
export const SUPPORT_EMAIL = 'hello@godough.co'
export const SUPPORT_MAILTO = `mailto:${SUPPORT_EMAIL}`

export function supportHref(subject: string): string {
  return `${SUPPORT_MAILTO}?subject=${encodeURIComponent(subject)}`
}
