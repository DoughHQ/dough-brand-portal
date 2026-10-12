import type { ReactNode } from 'react'
import {
  formatCalendarDate,
  formatRelativeTimestamp,
  shopperDatesLine,
  shopperLine,
} from '@/lib/distribution/actions'
import type { DistributionRow } from '@/lib/distribution/grouping'
import { PRODUCT_NAME } from '@/lib/brand'

export default function EvidenceStack({
  row,
  reportDates,
  weakCorroboration,
}: {
  row: DistributionRow
  reportDates: string[]
  weakCorroboration: boolean
}) {
  const items: { key: string; className: string; node: ReactNode }[] = []

  if (row.brand_status === 'active') {
    items.push({
      key: 'brand',
      className: 'wis-ev--brand',
      node: (
        <>
          You declared this
          {row.brand_declared_at
            ? ` · ${formatRelativeTimestamp(row.brand_declared_at)}`
            : ''}
        </>
      ),
    })
  }
  if (row.brand_delisted_on) {
    items.push({
      key: 'delisted',
      className: 'wis-ev--delisted',
      node: (
        <>
          You marked this delisted as of{' '}
          {formatCalendarDate(row.brand_delisted_on)}
        </>
      ),
    })
  }
  if (row.dough_seeded) {
    items.push({
      key: 'dough',
      className: 'wis-ev--dough',
      node: (
        <>
          {PRODUCT_NAME} found this
          {row.seed_found_at
            ? ` · ${formatRelativeTimestamp(row.seed_found_at)}`
            : ''}
          {row.seed_evidence_url ? (
            <>
              {' '}
              ·{' '}
              <a href={row.seed_evidence_url} target="_blank" rel="noreferrer">
                evidence
              </a>
            </>
          ) : null}
        </>
      ),
    })
  }
  if (row.shopper_reports > 0) {
    const dates = shopperDatesLine(reportDates)
    items.push({
      key: 'shoppers',
      className: `wis-ev--shoppers${row.shopper_signal_stale ? ' wis-ev--stale' : ''}${
        weakCorroboration ? ' wis-ev--weak' : ''
      }`,
      node: (
        <>
          {shopperLine(row.shopper_reports, row.last_reported_on)}
          {dates ? (
            <>
              <br />
              <span className="wis-ev-dates">{dates}</span>
            </>
          ) : null}
          {weakCorroboration ? (
            <>
              <br />
              <span className="wis-ev-hint">
                {PRODUCT_NAME} also found this banner — thin shopper signal
              </span>
            </>
          ) : null}
        </>
      ),
    })
  }

  if (items.length === 0) return null
  return (
    <ul className="wis-evidence">
      {items.map((item) => (
        <li key={item.key} className={item.className}>
          {item.node}
        </li>
      ))}
    </ul>
  )
}
