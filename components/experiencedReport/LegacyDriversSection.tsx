import type {
  ChoiceDrivers,
  DriverRow,
} from '@/lib/experiencedReport/types'
import { formatPct01 } from '@/lib/experiencedReport/withheldCopy'
import { WithheldMetric } from './WithheldMetric'
import { SectionShell, ShareBar } from './deckChrome'
import { REPORT_SECTIONS } from './reportSections'

function DriverColumn({
  title,
  emptyCopy,
  drivers,
  tone,
}: {
  title: string
  emptyCopy: string
  drivers: DriverRow[]
  tone: 'own' | 'against'
}) {
  const allWithheld = drivers.length > 0 && drivers.every((d) => !d.reportable)
  const showEmpty = drivers.length === 0 || allWithheld
  const withheldSeed = drivers.find(() => true)

  return (
    <div style={{ minWidth: 0 }}>
      <h3
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: 'var(--ink-muted)',
          margin: '0 0 12px',
        }}
      >
        {title}
      </h3>
      {showEmpty ? (
        <WithheldMetric
          metric={{
            reportable: false,
            withheld_reason: withheldSeed?.withheld_reason ?? emptyCopy,
            n_answers: withheldSeed?.n_answers,
            n_citing: withheldSeed?.n_citing,
            n_users: withheldSeed?.n_users,
            n_decisive: withheldSeed?.n_decisive,
          }}
        >
          {null}
        </WithheldMetric>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {drivers.map((d) => (
            <div key={d.driver}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                  fontFamily: 'var(--font-sans)',
                  fontSize: 13,
                  color: 'var(--ink)',
                }}
              >
                <span style={{ fontWeight: 500 }}>{d.driver}</span>
                {d.reportable && d.share != null ? (
                  <span style={{ color: 'var(--ink-muted)', flexShrink: 0 }}>
                    {formatPct01(d.share)}
                  </span>
                ) : null}
              </div>
              <WithheldMetric metric={d}>
                <ShareBar share={d.share ?? 0} tone={tone} />
              </WithheldMetric>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function LegacyDriversSection({
  drivers,
  notes,
}: {
  drivers: ChoiceDrivers | null
  notes: string[]
}) {
  const won = drivers?.by_outcome?.focal_won ?? []
  const lost = drivers?.by_outcome?.focal_lost ?? []

  return (
    <SectionShell
      id={REPORT_SECTIONS[1].id}
      number={2}
      title={REPORT_SECTIONS[1].title}
      sub={drivers?.interpretation ?? undefined}
      notes={notes}
    >
      <div className="deck-drivers-grid" style={{ display: 'grid', gap: 24 }}>
        <DriverColumn
          title="When they chose you"
          emptyCopy="Not enough decisive wins to break down yet."
          drivers={won}
          tone="own"
        />
        <DriverColumn
          title="When they chose against you"
          emptyCopy="Not enough decisive losses to break down yet."
          drivers={lost}
          tone="against"
        />
      </div>
    </SectionShell>
  )
}
