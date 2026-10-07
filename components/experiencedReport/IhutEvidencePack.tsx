import type {
  IhutCoreAttributeRow,
  IhutCoreReport,
  IhutCoreShareRow,
  IhutCoreStrengthRow,
} from '@/lib/experiencedReport/ihutCoreTypes'
import {
  StoryChapter,
} from '@/components/reportStory/ReportStory'
import story from '@/components/reportStory/reportStory.module.css'
import { DataGapNotice } from './DecisionChapters'
import ev from './ihutEvidence.module.css'

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
  { href: '#trust', label: 'Method' },
] as const

function pct(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—'
  const unit = value > 1 ? value / 100 : value
  return `${Math.round(unit * 1000) / 10}%`
}

function unit(value: number | null | undefined): number {
  if (value == null || !Number.isFinite(value)) return 0
  return value > 1 ? value / 100 : value
}

function sortedRanks(rows: IhutCoreStrengthRow[]): IhutCoreStrengthRow[] {
  return [...rows]
    .filter((row) => row.rank != null)
    .sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99))
}

function RankList({
  rows,
  heroRef,
}: {
  rows: IhutCoreStrengthRow[]
  heroRef: number
}) {
  const ranked = sortedRanks(rows)
  if (!ranked.length) {
    return <p className={story.cardText}>Not measured in this study.</p>
  }
  return (
    <ol className={ev.rankList}>
      {ranked.map((row) => {
        const yours = row.ref === heroRef || row.is_yours
        return (
          <li className={ev.rankListItem} key={`${row.ref}-${row.rank}`}>
            <span
              className={`${ev.rankBadge} ${yours ? ev.rankBadgeYours : ''}`}
            >
              {row.rank}
            </span>
            <span>
              {row.name}
              {yours ? <span className={ev.yoursMark}>Yours</span> : null}
            </span>
            <span className={story.finePrint} style={{ margin: 0 }}>
              {row.strength != null ? String(row.strength) : ''}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

function ShareTable({
  rows,
  heroRef,
  valueKey,
  valueLabel,
}: {
  rows: IhutCoreShareRow[]
  heroRef: number
  valueKey: 'top_two_share' | 'first_share' | 'liked_and_expected_good_share'
  valueLabel: string
}) {
  const sorted = [...rows].sort(
    (a, b) => unit(b[valueKey] as number | null) - unit(a[valueKey] as number | null),
  )
  if (!sorted.length) return null
  const max = Math.max(0.01, ...sorted.map((r) => unit(r[valueKey] as number | null)))

  return (
    <div className={ev.tableWrap}>
      <table className={ev.table}>
        <thead>
          <tr>
            <th>Product</th>
            <th>{valueLabel}</th>
            <th>Distribution</th>
            <th>n</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => {
            const yours = row.ref === heroRef
            const share = unit(row[valueKey] as number | null)
            return (
              <tr key={row.ref} className={yours ? ev.yours : undefined}>
                <td>
                  {row.name}
                  {yours ? <span className={ev.yoursMark}>Yours</span> : null}
                </td>
                <td className={ev.num}>{pct(row[valueKey] as number | null)}</td>
                <td className={ev.barCell}>
                  <div className={ev.shareTrack}>
                    <div
                      className={`${ev.shareFill} ${yours ? '' : ev.shareFillMuted}`}
                      style={{ width: `${(share / max) * 100}%` }}
                    />
                  </div>
                </td>
                <td className={ev.num}>{row.n}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function groupAttributes(rows: IhutCoreAttributeRow[]) {
  const map = new Map<string, IhutCoreAttributeRow[]>()
  for (const row of rows) {
    const key = row.attribute_label || row.attribute
    const list = map.get(key) ?? []
    list.push(row)
    map.set(key, list)
  }
  return [...map.entries()].map(([label, items]) => ({
    label,
    items: [...items].sort(
      (a, b) =>
        unit(b.just_right_share) - unit(a.just_right_share) ||
        a.name.localeCompare(b.name),
    ),
  }))
}

function AttributeJarBook({
  rows,
  heroRef,
}: {
  rows: IhutCoreAttributeRow[]
  heroRef: number
}) {
  const groups = groupAttributes(rows)
  if (!groups.length) {
    return (
      <DataGapNotice
        title="No attribute diagnostics yet"
        body="Just-right ratings are not included in this freeze."
      />
    )
  }

  return (
    <div className={ev.jarGroup}>
      {groups.map((group) => (
        <article className={ev.jarCard} key={group.label}>
          <div className={ev.jarCardHead}>
            <h4 className={ev.jarAttr}>{group.label}</h4>
            <span className={ev.jarMeta}>
              {group.items.length} product
              {group.items.length === 1 ? '' : 's'} · too little / just right /
              too much
            </span>
          </div>
          <div className={ev.jarRows}>
            {group.items.map((row) => {
              const yours = row.ref === heroRef
              const little = unit(row.too_little_share)
              const right = unit(row.just_right_share)
              const much = unit(row.too_much_share)
              return (
                <div className={ev.jarRow} key={`${row.ref}-${row.attribute}`}>
                  <div className={ev.jarName}>
                    {row.name}
                    {yours ? <span className={ev.yoursMark}>Yours</span> : null}
                  </div>
                  <div className={ev.jarStack} title={`n=${row.n}`}>
                    <div
                      className={ev.jarTooLittle}
                      style={{ width: `${little * 100}%` }}
                    />
                    <div
                      className={ev.jarJustRight}
                      style={{ width: `${right * 100}%` }}
                    />
                    <div
                      className={ev.jarTooMuch}
                      style={{ width: `${much * 100}%` }}
                    />
                  </div>
                  <div className={ev.num}>{pct(row.just_right_share)} JAR</div>
                </div>
              )
            })}
          </div>
          <div className={ev.jarLegend}>
            <span>
              <i className={`${ev.jarSwatch} ${ev.jarTooLittle}`} />
              Too little
            </span>
            <span>
              <i className={`${ev.jarSwatch} ${ev.jarJustRight}`} />
              Just right
            </span>
            <span>
              <i className={`${ev.jarSwatch} ${ev.jarTooMuch}`} />
              Too much
            </span>
          </div>
        </article>
      ))}
    </div>
  )
}

function CountBank({
  rows,
  noun = 'response',
}: {
  rows: Array<{ answer: string; n: number }>
  noun?: string
}) {
  if (!rows.length) return null
  const sorted = [...rows].sort((a, b) => b.n - a.n)
  const max = Math.max(1, ...sorted.map((r) => r.n))
  return (
    <div className={story.rows}>
      {sorted.map((row) => (
        <div className={story.dataRow} key={row.answer}>
          <div className={story.rowLabel}>
            <span>{row.answer}</span>
            <strong>
              {row.n} {noun}
              {row.n === 1 ? '' : 's'}
            </strong>
          </div>
          <div className={story.rowTrack}>
            <div
              className={story.rowFill}
              style={{ width: `${(row.n / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function WhyBank({ rows }: { rows: Array<{ answer: string; n: number }> }) {
  if (!rows.length) {
    return (
      <DataGapNotice
        title="No coded taste reasons yet"
        body="Open-end themes will appear here when the freeze includes taste_why counts."
      />
    )
  }
  const sorted = [...rows].sort((a, b) => b.n - a.n)
  const max = Math.max(1, ...sorted.map((r) => r.n))
  const total = sorted.reduce((sum, r) => sum + r.n, 0)

  return (
    <div className={ev.whyBank}>
      {sorted.map((row, index) => (
        <div className={ev.whyRow} key={`${row.answer}-${index}`}>
          <span className={ev.whyRank}>
            {String(index + 1).padStart(2, '0')}
          </span>
          <p className={ev.whyAnswer}>{row.answer}</p>
          <span className={ev.whyCount}>
            {row.n} · {pct(total > 0 ? row.n / total : null)} of mentions
          </span>
          <div className={ev.whyBarWrap}>
            <div
              className={ev.whyBar}
              style={{ width: `${(row.n / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function movementFor(
  shelf: IhutCoreStrengthRow | undefined,
  taste: IhutCoreStrengthRow | undefined,
) {
  if (shelf?.rank == null || taste?.rank == null) return null
  const delta = shelf.rank - taste.rank
  if (delta > 0) return { kind: 'up' as const, label: `↑ ${delta} rank` }
  if (delta < 0) return { kind: 'down' as const, label: `↓ ${Math.abs(delta)} rank` }
  return { kind: 'held' as const, label: 'Held' }
}

type Props = {
  report: IhutCoreReport
  productName: string
  productRef: number
  positionTitle: string
  positionLead: string
  chapterStart?: number
}

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

export function FieldEvidenceChapter({
  report,
  productName,
  productRef,
  positionTitle,
  positionLead,
  number = '02',
}: {
  report: IhutCoreReport
  productName: string
  productRef: number
  positionTitle: string
  positionLead: string
  number?: string
}) {
  const shelfRows = report.promise_vs_delivery?.shelf ?? []
  const tasteRows = report.promise_vs_delivery?.taste ?? []
  const mapRows = report.promise_vs_delivery?.map ?? []
  const allRefs = new Set([
    ...shelfRows.map((r) => r.ref),
    ...tasteRows.map((r) => r.ref),
  ])

  return (
    <StoryChapter
      id="field"
      number={number}
      kicker="Evidence · Shelf → taste"
      title={positionTitle}
      lead={positionLead}
      context={`${allRefs.size} product${allRefs.size === 1 ? '' : 's'} in field`}
    >
      {shelfRows.length || tasteRows.length ? (
        <>
          <div className={ev.splitGrid}>
            <article className={ev.panel}>
              <p className={ev.panelEyebrow}>Before tasting</p>
              <h3 className={ev.panelTitle}>Shelf promise</h3>
              <RankList rows={shelfRows} heroRef={productRef} />
            </article>
            <article className={ev.panel}>
              <p className={ev.panelEyebrow}>After tasting</p>
              <h3 className={ev.panelTitle}>Delivered experience</h3>
              <RankList rows={tasteRows} heroRef={productRef} />
            </article>
          </div>

          {allRefs.size > 0 ? (
            <div className={ev.measureBlock}>
              <div className={ev.measureHead}>
                <h4 className={ev.measureTitle}>Movement by product</h4>
                <p className={ev.measureNote}>
                  Rank change from shelf promise to tasted experience for{' '}
                  {productName} and the field.
                </p>
              </div>
              <div className={ev.tableWrap}>
                <table className={ev.table}>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Shelf</th>
                      <th>Taste</th>
                      <th>Movement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...allRefs].map((ref) => {
                      const shelf = shelfRows.find((r) => r.ref === ref)
                      const taste = tasteRows.find((r) => r.ref === ref)
                      const name = shelf?.name ?? taste?.name ?? `Product ${ref}`
                      const yours = ref === productRef
                      const move = movementFor(shelf, taste)
                      return (
                        <tr key={ref} className={yours ? ev.yours : undefined}>
                          <td>
                            {name}
                            {yours ? (
                              <span className={ev.yoursMark}>Yours</span>
                            ) : null}
                          </td>
                          <td className={ev.num}>
                            {shelf?.rank != null ? `#${shelf.rank}` : '—'}
                          </td>
                          <td className={ev.num}>
                            {taste?.rank != null ? `#${taste.rank}` : '—'}
                          </td>
                          <td>
                            {move ? (
                              <span
                                className={`${ev.movementBadge} ${
                                  move.kind === 'up'
                                    ? ev.movedUp
                                    : move.kind === 'down'
                                      ? ev.movedDown
                                      : ev.held
                                }`}
                              >
                                {move.label}
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {mapRows.length ? (
            <p className={story.finePrint}>
              {report.promise_vs_delivery?.note ??
                'Underlying Bradley–Terry strengths are model scores, not percentages.'}
            </p>
          ) : (
            <p className={story.finePrint}>
              Rank is shown because it is decision-readable. Underlying
              Bradley–Terry strengths are model scores, not percentages.
            </p>
          )}
        </>
      ) : (
        <DataGapNotice
          title="No promise-to-delivery comparison yet"
          body="Both shelf and tasted positions are required before this report claims movement."
        />
      )}
    </StoryChapter>
  )
}

export function LikingEvidenceChapter({
  report,
  productRef,
  number = '03',
}: {
  report: IhutCoreReport
  productRef: number
  number?: string
}) {
  const rows = report.liking ?? []
  const hero = rows.find((r) => r.ref === productRef)
  const title = hero?.top_two_share != null
    ? `${pct(hero.top_two_share)} top-two liking for your product.`
    : 'Liking across the tested field.'

  return (
    <StoryChapter
      id="liking"
      number={number}
      kicker="Evidence · Liking"
      title={title}
      lead="Top-two-box liking for every product in the freeze. Compare the field — do not average unlike seats."
      context={`${rows.length} product${rows.length === 1 ? '' : 's'}`}
    >
      {rows.length ? (
        <ShareTable
          rows={rows}
          heroRef={productRef}
          valueKey="top_two_share"
          valueLabel="Top-two liking"
        />
      ) : (
        <DataGapNotice
          title="Liking not in this freeze"
          body="No liking shares are available to page."
        />
      )}
    </StoryChapter>
  )
}

export function AttributeEvidenceChapter({
  report,
  productName,
  productRef,
  number = '04',
}: {
  report: IhutCoreReport
  productName: string
  productRef: number
  number?: string
}) {
  const rows = report.attribute_penalties ?? []
  const groups = groupAttributes(rows)
  const heroRows = rows.filter((r) => r.ref === productRef)
  const worst = [...heroRows].sort(
    (a, b) => unit(a.just_right_share) - unit(b.just_right_share),
  )[0]
  const title = worst
    ? `${worst.attribute_label}: ${pct(worst.just_right_share)} just right for ${productName}.`
    : 'Just-right diagnostics across attributes.'

  return (
    <StoryChapter
      id="attributes"
      number={number}
      kicker="Evidence · Attributes"
      title={title}
      lead="Every attribute in the freeze, for every product with ratings. Directional — not proof that changing one attribute will move the verdict."
      context={`${groups.length} attribute${groups.length === 1 ? '' : 's'}`}
    >
      <AttributeJarBook rows={rows} heroRef={productRef} />
    </StoryChapter>
  )
}

export function WhyEvidenceChapter({
  report,
  number = '05',
}: {
  report: IhutCoreReport
  number?: string
}) {
  const rows = report.taste_why ?? []
  const top = [...rows].sort((a, b) => b.n - a.n)[0]
  const title = top
    ? `“${top.answer}” led the coded taste reasons (${top.n} mentions).`
    : 'Coded taste reasons from the freeze.'

  return (
    <StoryChapter
      id="why"
      number={number}
      kicker="Evidence · Why"
      title={title}
      lead="Full coded bank of taste-choice reasons — counts and share of mentions. Themes explain preference; they do not prove causality."
      context={`${rows.length} theme${rows.length === 1 ? '' : 's'}`}
    >
      <WhyBank rows={rows} />
    </StoryChapter>
  )
}

export function BuyOrderEvidenceChapter({
  report,
  productRef,
  number = '06',
}: {
  report: IhutCoreReport
  productRef: number
  number?: string
}) {
  const rows = report.buy_order ?? []
  const hero = rows.find((r) => r.ref === productRef)
  const title = hero?.first_share != null
    ? `${pct(hero.first_share)} ranked your product first after tasting.`
    : 'Preference order after tasting.'

  return (
    <StoryChapter
      id="buy-order"
      number={number}
      kicker="Evidence · Buy order"
      title={title}
      lead="Share ranked first after tasting, plus average rank where available. Preference order is not buy-at-price intent."
      context={`${rows.length} product${rows.length === 1 ? '' : 's'}`}
    >
      {rows.length ? (
        <>
          <ShareTable
            rows={rows}
            heroRef={productRef}
            valueKey="first_share"
            valueLabel="Ranked first"
          />
          <div className={ev.measureBlock}>
            <div className={ev.measureHead}>
              <h4 className={ev.measureTitle}>Average rank</h4>
              <p className={ev.measureNote}>Lower is better · after tasting</p>
            </div>
            <div className={ev.tableWrap}>
              <table className={ev.table}>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Avg rank</th>
                    <th>n</th>
                  </tr>
                </thead>
                <tbody>
                  {[...rows]
                    .sort(
                      (a, b) =>
                        (a.avg_rank ?? 99) - (b.avg_rank ?? 99),
                    )
                    .map((row) => {
                      const yours = row.ref === productRef
                      return (
                        <tr
                          key={row.ref}
                          className={yours ? ev.yours : undefined}
                        >
                          <td>
                            {row.name}
                            {yours ? (
                              <span className={ev.yoursMark}>Yours</span>
                            ) : null}
                          </td>
                          <td className={ev.num}>
                            {row.avg_rank != null
                              ? row.avg_rank.toFixed(2)
                              : '—'}
                          </td>
                          <td className={ev.num}>{row.n}</td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <DataGapNotice
          title="Buy order not in this freeze"
          body="No first-share or average-rank rows are available."
        />
      )}
    </StoryChapter>
  )
}

export function ExpectationEvidenceChapter({
  report,
  productRef,
  number = '07',
}: {
  report: IhutCoreReport
  productRef: number
  number?: string
}) {
  const rows = report.expectation_vs_experience ?? []
  const hero = rows.find((r) => r.ref === productRef)
  const title = hero?.liked_and_expected_good_share != null
    ? `${pct(hero.liked_and_expected_good_share)} liked it and expected it to be good.`
    : 'Expectation versus experience.'

  return (
    <StoryChapter
      id="expectation"
      number={number}
      kicker="Evidence · Expectation"
      title={title}
      lead="Share who both liked the product and said their expectation was met. Gaps here flag promise–delivery risk."
      context={`${rows.length} product${rows.length === 1 ? '' : 's'}`}
    >
      {rows.length ? (
        <ShareTable
          rows={rows}
          heroRef={productRef}
          valueKey="liked_and_expected_good_share"
          valueLabel="Liked + expected good"
        />
      ) : (
        <DataGapNotice
          title="Expectation gap not in this freeze"
          body="No expectation-versus-experience shares are available."
        />
      )}
    </StoryChapter>
  )
}

export function Day2EvidenceChapter({
  report,
  number = '09',
}: {
  report: IhutCoreReport
  number?: string
}) {
  const day2 = report.day2
  const available =
    day2.preference_hold.n > 0 ||
    day2.consumption.length > 0 ||
    day2.wear.length > 0
  const title =
    day2.preference_hold.n > 0
      ? `${pct(day2.preference_hold.same_favorite_share)} kept the same favorite on Day 2.`
      : 'Day 2 evidence is not available yet.'

  return (
    <StoryChapter
      id="durability"
      number={number}
      kicker="Evidence · Day 2"
      title={title}
      lead={
        available
          ? 'Follow-up hold, consumption, and wear. Observational — not causal proof that Day 1 drove Day 2.'
          : 'This section stays visible so a missing follow-up is explicit, not silently omitted.'
      }
      context="Follow-up evidence"
    >
      {available ? (
        <>
          <div className={ev.statStrip}>
            <article className={ev.statCard}>
              <p className={ev.statValue}>
                {pct(day2.preference_hold.same_favorite_share)}
              </p>
              <p className={ev.statLabel}>
                Same Day 1 favorite · n={day2.preference_hold.n}
              </p>
            </article>
            <article className={ev.statCard}>
              <p className={ev.statValue}>{day2.consumption.length}</p>
              <p className={ev.statLabel}>Consumption response buckets</p>
            </article>
            <article className={ev.statCard}>
              <p className={ev.statValue}>{day2.wear.length}</p>
              <p className={ev.statLabel}>Wear / familiarity buckets</p>
            </article>
          </div>

          <div className={ev.splitGrid} style={{ marginTop: 18 }}>
            <article className={ev.panel}>
              <p className={ev.panelEyebrow}>Consumption</p>
              <h3 className={ev.panelTitle}>How much was used</h3>
              {day2.consumption.length ? (
                <CountBank rows={day2.consumption} />
              ) : (
                <p className={story.cardText}>Not reported.</p>
              )}
            </article>
            <article className={ev.panel}>
              <p className={ev.panelEyebrow}>Wear</p>
              <h3 className={ev.panelTitle}>How the experience held</h3>
              {day2.wear.length ? (
                <CountBank rows={day2.wear} />
              ) : (
                <p className={story.cardText}>Not reported.</p>
              )}
            </article>
          </div>
        </>
      ) : (
        <DataGapNotice
          title="No Day 2 response is included"
          body="No hold, consumption, or wear claim is made from the Day 1 result."
        />
      )}
    </StoryChapter>
  )
}
