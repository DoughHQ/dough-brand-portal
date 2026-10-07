import type { CSSProperties } from 'react'
import {
  StoryChapter,
  type ReportTone,
  type ScorecardItem,
  Scorecard,
} from '@/components/reportStory/ReportStory'
import styles from '@/components/reportStory/reportStory.module.css'
import type {
  DecisionClaim,
  DecisionStory,
  PriceDistribution,
  PriceTransition,
} from '@/lib/experiencedReport/decisionStory'

function pct(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—'
  const unit = value > 1 ? value / 100 : value
  return `${Math.round(unit * 100)}%`
}

function money(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—'
  return `$${value.toFixed(2)}`
}

function claimTone(status: DecisionClaim['status']): ReportTone {
  switch (status) {
    case 'reportable':
      return 'neutral'
    case 'small_base':
      return 'uncertain'
    case 'withheld':
    case 'not_measured':
    case 'not_applicable':
      return 'negative'
    default:
      return 'neutral'
  }
}

export const DECISION_CHAPTER_LINKS = [
  { href: '#overview', label: 'Overview' },
  { href: '#decision', label: 'Decision' },
  { href: '#field', label: 'Field' },
  { href: '#diagnosis', label: 'Why' },
  { href: '#price', label: 'Price' },
  { href: '#durability', label: 'Durability' },
  { href: '#trust', label: 'Trust' },
] as const

export function ClaimStack({ claims }: { claims: DecisionClaim[] }) {
  if (!claims.length) return null
  return (
    <div className={styles.claimStack}>
      {claims.map((claim) => (
        <article
          key={claim.id}
          className={`${styles.claimCard} ${styles[`claim_${claim.status}`] ?? ''}`}
        >
          <div className={styles.claimMeta}>
            <span className={styles.claimKind}>{claim.kind.replace(/_/g, ' ')}</span>
            <span className={styles.claimStatus}>{claim.status.replace(/_/g, ' ')}</span>
          </div>
          <h3 className={styles.claimTitle}>{claim.title}</h3>
          <p className={styles.claimBody}>{claim.body}</p>
          <p className={styles.claimSource}>
            Source · {claim.source}
            {claim.n != null ? ` · n=${claim.n}` : ''}
            {claim.lo != null && claim.hi != null
              ? ` · ${pct(claim.lo)}–${pct(claim.hi)}`
              : ''}
          </p>
          {claim.limitation ? (
            <p className={styles.claimLimit}>{claim.limitation}</p>
          ) : null}
        </article>
      ))}
    </div>
  )
}

export function DataGapNotice({
  title,
  body,
}: {
  title: string
  body: string
}) {
  return (
    <div className={styles.emptyState}>
      <strong>{title}</strong>
      <p>{body}</p>
    </div>
  )
}

function DistributionStack({
  row,
  label,
}: {
  row: PriceDistribution
  label: string
}) {
  const yes = row.yesShare ?? 0
  const maybe = row.maybeShare ?? 0
  const no = row.noShare ?? Math.max(0, 1 - yes - maybe)
  return (
    <div className={styles.distBlock}>
      <div className={styles.rowLabel}>
        <span>
          {label} · {row.name} at {money(row.testedPriceDollars)}
        </span>
        <strong>
          {pct(row.yesShare)} Yes · n={row.n}
          {!row.decisionReady ? ' · small base' : ''}
        </strong>
      </div>
      <div
        className={styles.distTrack}
        role="img"
        aria-label={`${label}: Yes ${pct(row.yesShare)}, Maybe ${pct(row.maybeShare)}, No ${pct(row.noShare)}`}
      >
        <span
          className={styles.distYes}
          style={{ width: `${Math.max(0, yes * 100)}%` } as CSSProperties}
        />
        <span
          className={styles.distMaybe}
          style={{ width: `${Math.max(0, maybe * 100)}%` } as CSSProperties}
        />
        <span
          className={styles.distNo}
          style={{ width: `${Math.max(0, no * 100)}%` } as CSSProperties}
        />
      </div>
      <div className={styles.legend}>
        <span>
          <span className={styles.legendSwatch} /> Yes {pct(row.yesShare)}
        </span>
        <span>
          <span className={styles.legendSwatchAmber} /> Maybe {pct(row.maybeShare)}
        </span>
        <span>
          <span className={styles.legendSwatchMuted} /> No {pct(row.noShare)}
        </span>
        {row.lo != null && row.hi != null ? (
          <span>
            Yes interval {pct(row.lo)}–{pct(row.hi)}
          </span>
        ) : null}
      </div>
    </div>
  )
}

const TRANSITION_KEYS = [
  'yes',
  'maybe',
  'no',
] as const

function TransitionHeatmap({ row }: { row: PriceTransition }) {
  const max = Math.max(
    1,
    ...TRANSITION_KEYS.flatMap((from) =>
      TRANSITION_KEYS.map(
        (to) => Number(row.matrix[`${from}_${to}`] ?? 0) || 0,
      ),
    ),
  )
  return (
    <div className={styles.heatWrap}>
      <p className={styles.cardEyebrow}>
        Day 1 → Day 2 · paired n={row.nPaired}
      </p>
      <table className={styles.heatTable}>
        <caption className={styles.srOnly}>
          Paired price-intent transitions for {row.name}
        </caption>
        <thead>
          <tr>
            <th scope="col">Day 1 \ Day 2</th>
            {TRANSITION_KEYS.map((key) => (
              <th scope="col" key={key}>
                {key}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {TRANSITION_KEYS.map((from) => (
            <tr key={from}>
              <th scope="row">{from}</th>
              {TRANSITION_KEYS.map((to) => {
                const n = Number(row.matrix[`${from}_${to}`] ?? 0) || 0
                const intensity = n / max
                return (
                  <td
                    key={to}
                    style={
                      {
                        background: `rgba(62, 107, 74, ${0.08 + intensity * 0.55})`,
                      } as CSSProperties
                    }
                  >
                    {n}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className={styles.finePrint}>
        Improved {pct(row.improvedShare)} · Held {pct(row.stableShare)} ·
        Worsened {pct(row.worsenedShare)}. Same tested shelf price both days.
      </p>
    </div>
  )
}

export function PriceValueChapter({
  story,
  number = '04',
}: {
  story: DecisionStory
  number?: string
}) {
  const price = story.price
  const leadClaim = price.claims[0]
  const title =
    leadClaim?.title ??
    (price.measured
      ? 'Tested-offer intent is still forming.'
      : 'No tested shelf price was measured.')

  return (
    <StoryChapter
      id="price"
      number={number}
      kicker="Evidence · Price"
      title={title}
      lead={price.interpretation}
      context={
        price.label === 'tested_offer_intent'
          ? 'Tested-offer intent · not demand'
          : 'Not measured'
      }
    >
      <ClaimStack claims={price.claims} />

      {price.measured && price.enabled ? (
        <>
          {price.testedPrices.length ? (
            <div className={styles.evidenceGrid}>
              {price.testedPrices.map((seat) => (
                <article className={styles.evidenceCard} key={seat.ref}>
                  <p className={styles.cardEyebrow}>
                    {seat.isYours ? 'Your product' : 'Field product'}
                  </p>
                  <h3 className={styles.cardTitle}>{seat.name}</h3>
                  <div className={styles.bigNumber}>
                    {money(seat.priceDollars)}
                  </div>
                  <p className={styles.cardText}>
                    Frozen shelf price shown to respondents. One price per seat
                    — not a price ladder.
                  </p>
                </article>
              ))}
            </div>
          ) : null}

          <div className={styles.distSection}>
            {price.day1.map((row) => (
              <DistributionStack key={`d1-${row.ref}`} row={row} label="Day 1" />
            ))}
            {price.day2.map((row) => (
              <DistributionStack key={`d2-${row.ref}`} row={row} label="Day 2" />
            ))}
          </div>

          {price.transitions
            .filter((row) => row.reportable || row.nPaired > 0)
            .map((row) => (
              <TransitionHeatmap key={`t-${row.ref}`} row={row} />
            ))}

          {price.valueLeakage
            .filter((row) => row.reportable || row.nFirst > 0)
            .map((row) => (
              <div className={styles.callout} key={`leak-${row.ref}`}>
                <span className={styles.calloutLabel}>Value leakage</span>
                <p>
                  {pct(row.share)} of respondents who ranked {row.name} first
                  after tasting also said No at {money(
                    price.day1.find((d) => d.ref === row.ref)?.testedPriceDollars,
                  )}{' '}
                  (n first={row.nFirst}; n first+No={row.nFirstButNoAtPrice}).
                  Observational gap — not a causal price effect.
                </p>
              </div>
            ))}
        </>
      ) : (
        <DataGapNotice
          title={
            price.label === 'not_measured'
              ? 'Price was not experimentally tested'
              : 'Price checks were off'
          }
          body={
            price.label === 'not_measured'
              ? 'This study may still show price as a cited reason for choice. That is not the same as measuring intent at a dollar price.'
              : 'Seats were incomplete, taste-only, or price checks were disabled at publish. No tested-offer intent is reported.'
          }
        />
      )}
    </StoryChapter>
  )
}

export function DecisionScorecardChapter({
  title,
  lead,
  items,
  implication,
}: {
  title: string
  lead: string
  items: ScorecardItem[]
  implication: string
}) {
  return (
    <StoryChapter
      id="decision"
      number="01"
      kicker="What happened?"
      title={title}
      lead={lead}
      context="Prespecified bars · frozen"
    >
      {items.length ? <Scorecard items={items} /> : null}
      <div className={styles.callout}>
        <span className={styles.calloutLabel}>What would change the call</span>
        <p>{implication}</p>
      </div>
    </StoryChapter>
  )
}

export function toneFromClaim(status: DecisionClaim['status']): ReportTone {
  return claimTone(status)
}
