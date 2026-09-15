import type { BrandSnapshot } from '@/lib/queries'

/** Pure narrative from intel stub — safe for parsers/tests (no server imports). */
export function generateBrandHomeNarrative(
  snapshot: Pick<
    BrandSnapshot,
    | 'elo_velocity_30d'
    | 'win_rate_30d'
    | 'momentum_label'
    | 'total_battles_30d'
    | 'total_battles_all_time'
    | 'compare_group_rank'
  >,
  brandName: string,
  totalBattles: number
): { headline: string; sub: string } {
  const delta30 = snapshot.elo_velocity_30d ?? 0
  const winRate = snapshot.win_rate_30d ?? 0
  const momentum = snapshot.momentum_label
  const ledgerBattles = Number.isFinite(totalBattles) ? Math.max(0, Math.trunc(totalBattles)) : 0
  if (delta30 > 20 && momentum === 'rising') {
    return {
      headline: `${brandName} is having its best 30 days since joining Dough — up ${Math.round(delta30)} points and winning ${Math.round(winRate * 100)}% of battles.`,
      sub: `Strongest momentum in its category this month · Updated daily`,
    }
  }
  if (delta30 > 5 && momentum === 'rising') {
    return {
      headline: `${brandName} is gaining ground — up ${Math.round(delta30)} ELO points over the last 30 days.`,
      sub: `Win rate ${Math.round(winRate * 100)}% · ${snapshot.total_battles_30d} battles this month · Updated daily`,
    }
  }
  if (delta30 < -10 && momentum === 'declining') {
    return {
      headline: `${brandName}'s preference score has dipped ${Math.abs(Math.round(delta30))} points this month.`,
      sub: `Win rate down to ${Math.round(winRate * 100)}% · See the full breakdown below · Updated daily`,
    }
  }
  if (winRate > 0.65 && momentum === 'stable') {
    return {
      headline: `${brandName} is holding strong — winning ${Math.round(winRate * 100)}% of head-to-head battles.`,
      sub: `${snapshot.total_battles_30d} battles this month · Category rank #${snapshot.compare_group_rank ?? '—'} · Updated daily`,
    }
  }
  if (snapshot.total_battles_all_time < 50) {
    return {
      headline: `${brandName} is getting started on Dough. Early data is coming in.`,
      sub: `${ledgerBattles.toLocaleString()} battles counted so far · Data updates daily`,
    }
  }
  return {
    headline: `${brandName} has completed ${ledgerBattles.toLocaleString()} battles on Dough.`,
    sub: `${snapshot.total_battles_30d} battles in the last 30 days · Updated daily`,
  }
}
