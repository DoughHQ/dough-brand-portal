'use client'

import type { ReactNode } from 'react'
import styles from './reportStory.module.css'

export { ReportToolbar } from './ReportToolbar'

export type ReportTone = 'positive' | 'negative' | 'uncertain' | 'neutral'

export type ScorecardItem = {
  label: string
  value: string
  interval?: string
  intervalPrefix?: string
  context?: string
  resultLabel: string
  tone: ReportTone
  claim: string
  fill?: number | null
  marker?: number | null
}

const toneClass: Record<ReportTone, string> = {
  positive: styles.positive,
  negative: styles.negative,
  uncertain: styles.uncertain,
  neutral: styles.neutral,
}

const dotClass: Record<ReportTone, string> = {
  positive: styles.statusDotPositive,
  negative: styles.statusDotNegative,
  uncertain: styles.statusDotUncertain,
  neutral: styles.statusDotNeutral,
}

function clampPercent(value: number): string {
  return `${Math.max(0, Math.min(100, value * 100))}%`
}

export function SimulatedBanner() {
  return (
    <div className={styles.simulatedBanner} role="note">
      Simulated report · This preview uses illustrative responses, not live
      research.
    </div>
  )
}

export function ExecutiveMemo({
  eyebrow,
  headline,
  lede,
  implication,
  metadata,
}: {
  eyebrow: string
  headline: string
  lede: string
  implication: string
  metadata: string[]
}) {
  return (
    <header className={styles.executive}>
      <div className={styles.executiveGrid}>
        <div>
          <p className={styles.eyebrow}>{eyebrow}</p>
          <h1 className={styles.headline}>{headline}</h1>
          <p className={styles.lede}>{lede}</p>
        </div>
        <aside className={styles.decisionBox}>
          <span className={styles.decisionLabel}>What this supports</span>
          <p>{implication}</p>
        </aside>
      </div>
      <div className={styles.metaRow}>
        {metadata.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
    </header>
  )
}

export function StoryIndex({
  links,
}: {
  links: Array<{ href: string; label: string }>
}) {
  return (
    <nav className={styles.storyIndex} aria-label="Report chapters">
      {links.map((link) => (
        <a href={link.href} key={link.href}>
          {link.label}
        </a>
      ))}
    </nav>
  )
}

export function StoryChapter({
  id,
  number,
  kicker,
  title,
  lead,
  context,
  children,
}: {
  id: string
  number: string
  kicker: string
  title: string
  lead?: string
  context?: string
  children?: ReactNode
}) {
  return (
    <section id={id} className={styles.chapter}>
      <div className={styles.chapterNumber}>{number}</div>
      <div className={styles.chapterContent}>
        <div className={styles.chapterMeta}>
          <span className={styles.chapterKicker}>{kicker}</span>
          {context ? (
            <span className={styles.chapterContext}>{context}</span>
          ) : null}
        </div>
        <h2 className={styles.chapterTitle}>{title}</h2>
        {lead ? <p className={styles.chapterLead}>{lead}</p> : null}
        {children}
      </div>
    </section>
  )
}

export function Scorecard({ items }: { items: ScorecardItem[] }) {
  return (
    <div className={styles.scoreGrid}>
      {items.map((item) => (
        <article
          className={`${styles.metricCard} ${toneClass[item.tone]}`}
          key={item.label}
        >
          <div className={styles.metricTopline}>
            <span className={styles.metricLabel}>{item.label}</span>
            <span className={styles.statusPill}>
              <span className={`${styles.statusDot} ${dotClass[item.tone]}`} />
              {item.resultLabel}
            </span>
          </div>
          <div className={styles.metricValue}>{item.value}</div>
          {item.interval || item.context ? (
            <div className={styles.metricRange}>
              {item.interval
                ? `${item.intervalPrefix ?? '95% interval'} ${item.interval}`
                : item.context}
              {item.interval && item.context ? ` · ${item.context}` : ''}
            </div>
          ) : null}
          <p className={styles.metricClaim}>{item.claim}</p>
          {item.fill != null ? (
            <>
              <div className={styles.barTrack} aria-hidden="true">
                <div
                  className={styles.barFill}
                  style={{ width: clampPercent(item.fill) }}
                />
                {item.marker != null ? (
                  <span
                    className={styles.barMarker}
                    style={{ left: clampPercent(item.marker) }}
                  />
                ) : null}
              </div>
              <div className={styles.barLegend}>
                <span>0%</span>
                <span>
                  {item.marker == null
                    ? ''
                    : `Bar ${clampPercent(item.marker)}`}
                </span>
                <span>100%</span>
              </div>
            </>
          ) : null}
        </article>
      ))}
    </div>
  )
}

export function ReportFooter({
  left,
  right = 'Dough · Decision evidence, plainly told',
}: {
  left: string
  right?: string
}) {
  return (
    <footer className={styles.footer}>
      <span>{left}</span>
      <span>{right}</span>
    </footer>
  )
}
