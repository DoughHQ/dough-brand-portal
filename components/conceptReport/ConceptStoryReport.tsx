'use client'

import type { ConceptTestReport } from '@/lib/conceptReport/conceptTestTypes'
import { deriveConceptNarratives } from '@/lib/conceptReport/conceptTestNarrative'
import {
  ExecutiveMemo,
  ReportFooter,
  ReportToolbar,
  Scorecard,
  StoryChapter,
  StoryIndex,
  type ReportTone,
  type ScorecardItem,
} from '@/components/reportStory/ReportStory'
import styles from '@/components/reportStory/reportStory.module.css'
import { resultLabel } from './story/storyFormat'
import { FirstLookChapter } from './story/FirstLookChapter'
import { ChoiceChapter } from './story/ChoiceChapter'
import { PriceChapter } from './story/PriceChapter'
import { VoicesChapter } from './story/VoicesChapter'
import { MethodChapter } from './story/MethodChapter'
import { SampleCompositionSection } from '@/components/reportStory/SampleCompositionSection'

type Props = {
  report: ConceptTestReport
  backHref: string
}

export function ConceptTestReportDeck({ report, backHref }: Props) {
  const narratives = deriveConceptNarratives(report)
  const narrative = narratives[0]
  const verdict = report.verdict[0]

  if (!narrative || !verdict) {
    return (
      <div className={styles.page}>
        <main className={styles.shell}>
          <ReportToolbar
            backHref={backHref}
            reportKind="Concept test"
            share={{
              productName: 'Concept',
              finding: 'The concept verdict is still forming.',
              implication: 'Return when the decision payload is ready.',
            }}
          />
          <ExecutiveMemo
            eyebrow="Concept test · Decision brief"
            headline="The concept verdict is still forming."
            lede="There is no frozen design verdict to interpret yet. This report will not substitute activity counts for a decision."
            implication="Return when the decision payload is ready."
            metadata={[`${report.sample.n_started} started`]}
          />
        </main>
      </div>
    )
  }

  const scoreItems: ScorecardItem[] = narrative.metrics.map((metric) => {
    const context =
      metric.key === 'head_to_head'
        ? `${verdict.head_to_head.wins}–${verdict.head_to_head.losses} · n=${verdict.head_to_head.n_respondents}`
        : metric.key === 'liking'
          ? `${verdict.liking.mode.replace(/_/g, ' ')}${
              verdict.liking.n_paired ? ` · n=${verdict.liking.n_paired}` : ''
            }`
          : `Stated willingness to pay · n=${verdict.price.n}`
    const fill =
      metric.key === 'head_to_head'
        ? verdict.head_to_head.win_share
        : metric.key === 'price'
          ? verdict.price.share_conservative
          : null
    const marker =
      metric.key === 'head_to_head'
        ? verdict.head_to_head.bar
        : metric.key === 'price'
          ? verdict.price.bar
          : null
    return {
      label: metric.label,
      value: metric.value,
      interval: metric.interval,
      context,
      resultLabel: resultLabel(metric.result),
      tone: metric.tone as ReportTone,
      claim: metric.claim,
      fill,
      marker,
    }
  })

  return (
    <div className={styles.page}>
      <main className={styles.shell}>
        <ReportToolbar
          backHref={backHref}
          reportKind="Concept test"
          share={{
            productName: narrative.name || 'Concept',
            finding: narrative.headline,
            implication: narrative.implication,
          }}
        />
        <ExecutiveMemo
          eyebrow="Concept test · Decision brief"
          headline={narrative.headline}
          lede={narrative.explanation}
          implication={narrative.implication}
          metadata={[
            `${report.sample.n_started} participant${
              report.sample.n_started === 1 ? '' : 's'
            } started`,
            report.benchmark
              ? `Benchmark · ${report.benchmark.name}`
              : 'No benchmark',
            '95% confidence',
          ]}
        />
        <StoryIndex
          links={[
            { href: '#decision', label: '01 · The decision' },
            { href: '#first-look', label: '02 · First impression' },
            { href: '#why', label: '03 · What shaped choice' },
            { href: '#price', label: '04 · Price evidence' },
            { href: '#sample-composition', label: '06 · Who took part' },
          ]}
        />

        <StoryChapter
          id="decision"
          number="01"
          kicker="The decision"
          title={narrative.headline}
          lead="The overall call comes from the frozen server verdict. The three cards show exactly why: choice, liking, and stated willingness to pay at your tested price."
          context="Pre-set bars · 95% confidence"
        >
          <Scorecard items={scoreItems} />
          <div className={styles.callout}>
            <span className={styles.calloutLabel}>Decision discipline</span>
            <p>{narrative.implication}</p>
          </div>
        </StoryChapter>

        <FirstLookChapter report={report} verdict={verdict} />

        <ChoiceChapter report={report} />

        <PriceChapter report={report} narrative={narrative} verdict={verdict} />

        <VoicesChapter report={report} />

        <SampleCompositionSection
          composition={report.sample_composition ?? null}
          number="06"
        />

        <MethodChapter report={report} />

        <ReportFooter left={`${verdict.name} · Concept decision report`} />
      </main>
    </div>
  )
}
