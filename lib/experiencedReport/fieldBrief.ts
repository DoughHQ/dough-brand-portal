/**
 * Pure field / decision-brief derivations for Report V2 visuals.
 * No invented ranks or prices — only what the payload supports.
 */

import { asUnit } from './executiveSummary'
import type { DecisionStory } from './decisionStory'
import type { OpponentRow } from './types'

export type FieldCall = 'ahead' | 'behind' | 'too_close' | 'forming'

export type HeadToHeadRow = {
  key: string
  opponentName: string
  opponentBrand: string | null
  experienceSplit: string | null
  winShare: number
  lo: number | null
  hi: number | null
  nDecisive: number | null
  nWins: number | null
  nLosses: number | null
  crossesEven: boolean
  call: 'win' | 'loss' | 'too_close'
}

export type FieldBrief = {
  rows: HeadToHeadRow[]
  beatMost: HeadToHeadRow | null
  beatLeast: HeadToHeadRow | null
  fieldSize: number
}

export type PreferenceBrief = {
  call: FieldCall
  callLabel: string
  share: number | null
  lo: number | null
  hi: number | null
  nDecisive: number | null
}

export type PriceBriefTile = {
  status: 'tested' | 'not_measured' | 'off' | 'forming'
  title: string
  detail: string
  priceLabel: string | null
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value))
}

export function derivePreferenceBrief(input: {
  share: number | null | undefined
  lo: number | null | undefined
  hi: number | null | undefined
  nDecisive?: number | null
  direction?: 'more' | 'less' | 'close' | null
}): PreferenceBrief {
  if (input.share == null || !Number.isFinite(input.share)) {
    return {
      call: 'forming',
      callLabel: 'Still forming',
      share: null,
      lo: null,
      hi: null,
      nDecisive: input.nDecisive ?? null,
    }
  }
  const share = clamp01(asUnit(input.share))
  const lo = input.lo == null ? null : clamp01(asUnit(input.lo))
  const hi = input.hi == null ? null : clamp01(asUnit(input.hi))
  const crossesEven =
    lo != null && hi != null
      ? lo < 0.5 && hi > 0.5
      : Math.abs(share - 0.5) < 0.03

  if (input.direction === 'close' || crossesEven) {
    return {
      call: 'too_close',
      callLabel: 'Too close to call',
      share,
      lo,
      hi,
      nDecisive: input.nDecisive ?? null,
    }
  }
  if (input.direction === 'less' || (hi != null ? hi < 0.5 : share < 0.5)) {
    return {
      call: 'behind',
      callLabel: 'Behind in field',
      share,
      lo,
      hi,
      nDecisive: input.nDecisive ?? null,
    }
  }
  if (input.direction === 'more' || (lo != null ? lo > 0.5 : share > 0.5)) {
    return {
      call: 'ahead',
      callLabel: 'Ahead in field',
      share,
      lo,
      hi,
      nDecisive: input.nDecisive ?? null,
    }
  }
  return {
    call: 'too_close',
    callLabel: 'Too close to call',
    share,
    lo,
    hi,
    nDecisive: input.nDecisive ?? null,
  }
}

function h2hCall(
  share: number,
  lo: number | null,
  hi: number | null,
): HeadToHeadRow['call'] {
  if (lo != null && hi != null) {
    if (lo > 0.5) return 'win'
    if (hi < 0.5) return 'loss'
    return 'too_close'
  }
  if (share > 0.55) return 'win'
  if (share < 0.45) return 'loss'
  return 'too_close'
}

export function deriveFieldBrief(
  opponents: OpponentRow[] | null | undefined,
): FieldBrief {
  const rows: HeadToHeadRow[] = (opponents ?? [])
    .filter(
      (row) => row.reportable && row.value != null && Number.isFinite(row.value),
    )
    .map((row) => {
      const winShare = clamp01(asUnit(row.value as number))
      const lo = row.ci_low == null ? null : clamp01(asUnit(row.ci_low))
      const hi = row.ci_high == null ? null : clamp01(asUnit(row.ci_high))
      const nDecisive = row.n_decisive ?? null
      const nWins =
        row.n_wins ??
        (nDecisive != null ? Math.round(winShare * nDecisive) : null)
      const nLosses =
        nDecisive != null && nWins != null
          ? Math.max(0, nDecisive - nWins)
          : null
      return {
        key: `${row.opponent_name}-${row.experience_split ?? 'all'}`,
        opponentName: row.opponent_name,
        opponentBrand: row.opponent_brand,
        experienceSplit: row.experience_split ?? null,
        winShare,
        lo,
        hi,
        nDecisive,
        nWins,
        nLosses,
        crossesEven: lo != null && hi != null ? lo < 0.5 && hi > 0.5 : false,
        call: h2hCall(winShare, lo, hi),
      }
    })
    .sort((a, b) => b.winShare - a.winShare)

  return {
    rows,
    beatMost: rows[0] ?? null,
    beatLeast: rows.length ? rows[rows.length - 1]! : null,
    fieldSize: rows.length,
  }
}

export function derivePriceBriefTile(story: DecisionStory): PriceBriefTile {
  if (story.price.label === 'not_measured' || !story.price.measured) {
    const headwind = story.price.claims.find(
      (c) => c.id === 'legacy-price-headwind',
    )
    return {
      status: 'not_measured',
      title: 'Price not tested',
      detail: headwind
        ? `Cited against the product ${Math.round((headwind.value ?? 0) * 100)}% of losses — reason share, not a list price.`
        : 'No shelf price was experimentally varied. Do not infer an optimal list price.',
      priceLabel: null,
    }
  }
  if (!story.price.enabled) {
    return {
      status: 'off',
      title: 'Price checks off',
      detail: 'Seats were incomplete or taste-only. No tested-offer intent.',
      priceLabel: null,
    }
  }
  const hero =
    story.price.day1.find((row) =>
      story.price.testedPrices.some((p) => p.ref === row.ref && p.isYours),
    ) ?? story.price.day1[0]
  if (!hero || hero.n < 10) {
    return {
      status: 'forming',
      title: 'Price still forming',
      detail: 'Tested-offer intent has not cleared the reporting floor.',
      priceLabel:
        hero?.testedPriceDollars != null
          ? `$${hero.testedPriceDollars.toFixed(2)}`
          : null,
    }
  }
  const yes =
    hero.yesShare == null ? '—' : `${Math.round(hero.yesShare * 100)}%`
  return {
    status: 'tested',
    title: `Yes ${yes} at tested shelf price`,
    detail: hero.decisionReady
      ? 'Stated intent at one frozen shelf price — not demand or an optimal price.'
      : 'Small base — descriptive only; not a pass/fail price call.',
    priceLabel:
      hero.testedPriceDollars != null
        ? `$${hero.testedPriceDollars.toFixed(2)}`
        : null,
  }
}

export function pct01(value: number | null | undefined, digits = 0): string {
  if (value == null || !Number.isFinite(value)) return '—'
  return `${(clamp01(asUnit(value)) * 100).toFixed(digits)}%`
}
