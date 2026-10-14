import Link from 'next/link'

export default function StudiesListHeader() {
  return (
    <header className="studies-header">
      <div style={{ minWidth: 0 }}>
        <h1 className="studies-title studies-title-sr">Studies</h1>
        <p className="studies-lede">
          Preference studies and results from verified consumers.
        </p>
      </div>
      <Link href="/studies/new" className="portal-btn portal-btn-cta studies-new-study">
        <span aria-hidden style={{ fontSize: 16, lineHeight: 1, marginTop: -1 }}>
          +
        </span>
        New study
      </Link>
    </header>
  )
}
