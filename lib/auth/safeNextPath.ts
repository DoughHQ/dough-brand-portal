/** Only allow internal relative paths — prevents open redirects. */
export function safeNextPath(raw: string | null, fallback = '/dashboard'): string {
  if (!raw) return fallback
  if (!raw.startsWith('/') || raw.startsWith('//')) return fallback
  if (raw.includes('://')) return fallback
  return raw
}
