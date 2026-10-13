import Link from 'next/link'
import { CONCEPT_REPORT_CHAPTERS } from '@/lib/checkout/included'

export default function CheckoutReportChapters({ missionId }: { missionId: string }) {
  return (
    <section className="checkout-panel" aria-labelledby="checkout-report-title">
      <h2 id="checkout-report-title">What you get back</h2>
      <div className="checkout-chapters">
        {CONCEPT_REPORT_CHAPTERS.map((chapter) => (
          <div className="checkout-chapter" key={chapter.title}>
            <p className="checkout-chapter-title">{chapter.title}</p>
            <p className="checkout-chapter-body">{chapter.body}</p>
          </div>
        ))}
        <Link
          className="checkout-chapter checkout-chapter-link"
          href={`/studies/concept/${missionId}/report?preview=sample`}
        >
          <p className="checkout-chapter-title">Sample report</p>
          <p className="checkout-chapter-body">See what the team gets back.</p>
        </Link>
      </div>
    </section>
  )
}
