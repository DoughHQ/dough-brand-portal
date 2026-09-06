import type { ExperiencedReportEnvelope } from '@/lib/experiencedReport/types'
import {
  deriveExecutiveSummary,
  type ExecutiveSummary,
} from '@/lib/experiencedReport/executiveSummary'
import { formatOf100, formatPct01 } from '@/lib/experiencedReport/withheldCopy'
import { Chip, CoinFlipTrack } from './deckChrome'
import { WithheldMetric } from './WithheldMetric'

function TileLabel({ children }: { children: string }) {
  return <div className="exec-tile-label">{children}</div>
}

function PreferenceTile({ summary }: { summary: ExecutiveSummary }) {
  const row = summary.headline
  if (!summary.preferenceReportable || row == null || summary.chosenOf100 == null) {
    return (
      <div className="exec-tile">
        <TileLabel>Preference</TileLabel>
        <WithheldMetric
          metric={{
            reportable: false,
            withheld_reason: row?.withheld_reason || summary.headlineStatus.label,
            n_decisive: row?.n_decisive,
            n_users: row?.n_users,
          }}
        />
      </div>
    )
  }

  return (
    <div className="exec-tile">
      <TileLabel>Preference</TileLabel>
      <div className="exec-numeral">{summary.chosenOf100}</div>
      <p className="exec-tile-copy">{`Chosen ${summary.chosenOf100} of 100 times`}</p>
      {summary.ciLow100 != null && summary.ciHigh100 != null ? (
        <p className="exec-tile-ci">
          Likely between {Math.min(summary.ciLow100, summary.ciHigh100)} and{' '}
          {Math.max(summary.ciLow100, summary.ciHigh100)}
        </p>
      ) : null}
      <CoinFlipTrack
        value={row.value ?? 0}
        ciLow={row.ci_low}
        ciHigh={row.ci_high}
        tone="own"
      />
    </div>
  )
}

function BuyAgainTile({ summary }: { summary: ExecutiveSummary }) {
  const yes = summary.definiteYes
  if (yes?.rate == null) {
    return (
      <div className="exec-tile">
        <TileLabel>Would buy again</TileLabel>
        <WithheldMetric
          metric={{
            reportable: false,
            withheld_reason: yes?.withheld_reason || undefined,
          }}
        />
      </div>
    )
  }

  const yesPct = formatPct01(yes.rate)
  const ttb = summary.topTwoBox?.rate != null ? formatPct01(summary.topTwoBox.rate) : null

  return (
    <div className="exec-tile">
      <TileLabel>Would buy again</TileLabel>
      <div className="exec-numeral">{formatOf100(yes.rate)}%</div>
      <p className="exec-tile-copy">
        {yesPct} would definitely buy again
        {ttb ? ` · ${ttb} yes or maybe` : ''}
      </p>
      {yes.ci_low != null && yes.ci_high != null ? (
        <p className="exec-tile-ci">
          Likely {formatPct01(yes.ci_low)}–{formatPct01(yes.ci_high)}
        </p>
      ) : null}
    </div>
  )
}

function DriverTile({
  label,
  pick,
  copy,
  tone,
}: {
  label: string
  pick: ExecutiveSummary['topDriver']
  copy: (name: string, pct: string) => string
  tone: 'own' | 'against'
}) {
  if (pick == null) {
    return (
      <div className="exec-tile">
        <TileLabel>{label}</TileLabel>
        <WithheldMetric metric={{ reportable: false }} />
      </div>
    )
  }
  const pct = formatOf100(pick.share)
  return (
    <div className={`exec-tile exec-tile--${tone}`}>
      <TileLabel>{label}</TileLabel>
      <div className="exec-driver-name">{pick.driver}</div>
      <p className="exec-tile-copy">{copy(pick.driver, pct)}</p>
    </div>
  )
}

function ConfidenceTile({ summary }: { summary: ExecutiveSummary }) {
  return (
    <div className="exec-tile">
      <TileLabel>Confidence & status</TileLabel>
      <div className="exec-confidence">{summary.confidence}</div>
      <p className="exec-tile-copy">{summary.stageLabel}</p>
      <p className="exec-tile-ci">Frozen · reproducible</p>
    </div>
  )
}

function ThinStatusCard({
  summary,
}: {
  summary: ExecutiveSummary
}) {
  return (
    <section className="exec-strip exec-strip--thin" aria-label="Report status">
      <div className="exec-thin-row">
        <Chip tone={summary.stageLabel === 'Final' ? 'pro' : 'amber'}>{summary.stageLabel}</Chip>
        <Chip tone={summary.headlineStatus.tone}>{summary.headlineStatus.label}</Chip>
      </div>
      <p className="exec-thin-participation">{summary.participationLine}</p>
      <WithheldMetric
        metric={{
          reportable: false,
          withheld_reason: summary.headline?.withheld_reason || undefined,
        }}
      />
    </section>
  )
}

export function ExecutiveSummaryStrip({
  envelope,
}: {
  envelope: ExperiencedReportEnvelope
}) {
  const summary = deriveExecutiveSummary(envelope)

  if (summary.mode === 'thin') {
    return <ThinStatusCard summary={summary} />
  }

  return (
    <section className="exec-strip" aria-label="Executive summary">
      <div className="exec-tiles">
        <PreferenceTile summary={summary} />
        <BuyAgainTile summary={summary} />
        <DriverTile
          label="Top driver"
          pick={summary.topDriver}
          tone="own"
          copy={(name, pct) => `${pct}% chose because of ${name}`}
        />
        <DriverTile
          label="Top headwind"
          pick={summary.topHeadwind}
          tone="against"
          copy={(name, pct) => `${pct}% chose against because of ${name}`}
        />
        <ConfidenceTile summary={summary} />
      </div>
      {summary.synthesis ? (
        <p className="exec-synthesis">{summary.synthesis}</p>
      ) : null}
    </section>
  )
}
