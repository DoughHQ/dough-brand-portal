import ev from '../ihutEvidence.module.css'

export const EVIDENCE_PACK_LINKS = [
  { href: '#overview', label: 'Overview' },
  { href: '#decision', label: 'Decision' },
  { href: '#field', label: 'Shelf → taste' },
  { href: '#liking', label: 'Liking' },
  { href: '#attributes', label: 'Attributes' },
  { href: '#why', label: 'Why' },
  { href: '#buy-order', label: 'Buy order' },
  { href: '#expectation', label: 'Expectation' },
  { href: '#price', label: 'Price' },
  { href: '#durability', label: 'Day 2' },
  { href: '#sample-composition', label: 'Who took part' },
  { href: '#trust', label: 'Method' },
] as const

export function EvidencePackHeader({ pageCount }: { pageCount: number }) {
  return (
    <div className={ev.packDivider} id="evidence">
      <h2 className={ev.packLabel}>Evidence pack</h2>
      <span className={ev.packMeta}>
        {pageCount} measure sections · frozen payload
      </span>
    </div>
  )
}

export function EvidenceToc() {
  return (
    <nav className={ev.toc} aria-label="Evidence pack contents">
      {EVIDENCE_PACK_LINKS.filter((l) => !['#overview', '#decision'].includes(l.href)).map(
        (link, i) => (
          <a className={ev.tocLink} href={link.href} key={link.href}>
            <span className={ev.tocNum}>{String(i + 1).padStart(2, '0')}</span>
            <span className={ev.tocLabel}>{link.label}</span>
          </a>
        ),
      )}
    </nav>
  )
}
