/** Share / print helpers for decision reports — pure strings only. */

export type ReportSharePayload = {
  productName: string
  finding: string
  implication?: string | null
  url?: string | null
  snapshotLabel?: string | null
}

export function reportPrintTitle(payload: Pick<ReportSharePayload, 'productName' | 'snapshotLabel'>): string {
  const base = `${payload.productName} · Dough decision report`
  return payload.snapshotLabel ? `${base} · ${payload.snapshotLabel}` : base
}

export function buildShareText(payload: ReportSharePayload): string {
  const lines = [
    payload.finding.trim(),
    payload.implication?.trim() ? payload.implication.trim() : null,
    payload.snapshotLabel ? `Snapshot · ${payload.snapshotLabel}` : null,
    payload.url?.trim() || null,
  ].filter((line): line is string => Boolean(line))
  return lines.join('\n\n')
}

export function buildShareLinkMessage(payload: ReportSharePayload): string {
  const url = payload.url?.trim()
  if (!url) return buildShareText(payload)
  return `${payload.finding.trim()}\n\n${url}`
}
