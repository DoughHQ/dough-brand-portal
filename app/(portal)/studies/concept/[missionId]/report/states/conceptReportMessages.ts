import type { ConceptReportErrorCode } from '@/lib/conceptReport/types'

export function messageForCode(code: ConceptReportErrorCode): {
  title: string
  body: string
} {
  switch (code) {
    case 'NO_REPORT_YET':
      return {
        title: "Report isn't ready yet",
        body: "This study's report isn't ready yet. A frozen snapshot appears after compute runs for this mission. This page only reads that snapshot — it never recomputes.",
      }
    case 'FORBIDDEN':
    case 'NOT_A_PORTAL_USER':
      return {
        title: 'No access',
        body: "You don't have access to this report.",
      }
    case 'NOT_AUTHENTICATED':
      return {
        title: 'Sign in required',
        body: 'Sign in to view this report.',
      }
    default:
      return {
        title: "Couldn't load report",
        body: 'Something went wrong loading this report. Try again in a moment.',
      }
  }
}
