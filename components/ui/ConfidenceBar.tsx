'use client'

import { useEffect, useRef, useState } from 'react'
import { formatPct, parseWithheldProgress } from '@/lib/portal-ui/format'
import styles from './ConfidenceBar.module.css'

export type ConfidenceBarProps = {
  value: number | null
  ciLow: number | null
  ciHigh: number | null
  label: string
  sublabel?: string
  reportable: boolean
  withheldReason?: string
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const handler = () => setReduced(mq.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return reduced
}

export function ConfidenceBar({
  value,
  ciLow,
  ciHigh,
  label,
  sublabel,
  reportable,
  withheldReason,
}: ConfidenceBarProps) {
  const reducedMotion = usePrefersReducedMotion()
  const [animatedWidth, setAnimatedWidth] = useState<number | null>(null)
  const hasAnimated = useRef(false)

  const showBar = reportable && value != null
  const isWinning = showBar && value >= 0.5
  const barHue = isWinning ? 'sage' : 'clay'
  const targetWidth = showBar ? Math.min(100, Math.max(0, value * 100)) : 0

  useEffect(() => {
    if (!showBar) {
      setAnimatedWidth(null)
      hasAnimated.current = false
      return
    }
    if (reducedMotion || hasAnimated.current) {
      setAnimatedWidth(targetWidth)
      return
    }
    hasAnimated.current = true
    setAnimatedWidth(0)
    const id = requestAnimationFrame(() => {
      setAnimatedWidth(targetWidth)
    })
    return () => cancelAnimationFrame(id)
  }, [showBar, targetWidth, reducedMotion, value])

  const progressHint = parseWithheldProgress(withheldReason)

  return (
    <div className={styles.root}>
      <div className={styles.labels}>
        <div className={styles.label}>{label}</div>
        {sublabel ? <div className={styles.sublabel}>{sublabel}</div> : null}
      </div>

      <div className={styles.trackBlock}>
        {showBar ? (
          <>
            <div className={styles.track}>
              <div className={styles.fiftyMarker} style={{ left: '50%' }}>
                <span className={styles.fiftyCaption}>50%</span>
              </div>

              {ciLow != null && ciHigh != null ? (
                <>
                  <div
                    className={`${styles.ciBand} ${isWinning ? styles.ciBandSage : styles.ciBandClay}`}
                    style={{
                      left: `${ciLow * 100}%`,
                      width: `${Math.max(0, (ciHigh - ciLow) * 100)}%`,
                    }}
                  />
                  <div
                    className={`${styles.whisker} ${isWinning ? styles.whiskerSage : styles.whiskerClay}`}
                    style={{ left: `${ciLow * 100}%` }}
                  />
                  <div
                    className={`${styles.whisker} ${isWinning ? styles.whiskerSage : styles.whiskerClay}`}
                    style={{ left: `${ciHigh * 100}%` }}
                  />
                </>
              ) : null}

              <div
                className={`${styles.barFill} ${isWinning ? styles.barSage : styles.barClay}`}
                style={{
                  width: `${animatedWidth ?? targetWidth}%`,
                  transition:
                    reducedMotion
                      ? 'none'
                      : `width var(--motion-duration) var(--motion-ease)`,
                }}
              />
            </div>

            <div className={styles.figures}>
              <span className={styles.point}>{formatPct(value)}</span>
              {ciLow != null && ciHigh != null ? (
                <span className={styles.ci}>
                  [{formatPct(ciLow)}–{formatPct(ciHigh)}]
                </span>
              ) : null}
            </div>
          </>
        ) : (
          <div className={styles.trackWithheld}>
            <div>
              <div className={styles.withheldLabel}>Gathering signal</div>
              {progressHint ? (
                <div className={styles.withheldDetail}>{progressHint}</div>
              ) : null}
            </div>
            <div
              className={styles.fiftyMarker}
              style={{ left: '50%', top: 0, bottom: 0 }}
              aria-hidden
            />
          </div>
        )}
      </div>
    </div>
  )
}
