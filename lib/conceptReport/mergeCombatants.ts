import type { SupabaseClient } from '@supabase/supabase-js'
import type { ConceptMissionReport, WinRateFieldRow } from './types'

type CombatantExtras = {
  frozen_price: number | string | null
  frozen_image_url: string | null
}

/**
 * Pure display merge: prices (and optional images) from mission_combatants by combatant_ref.
 * Never changes ranks or win rates.
 */
export async function mergeCombatantDisplay(
  supabase: SupabaseClient,
  missionId: string,
  report: ConceptMissionReport
): Promise<ConceptMissionReport> {
  const { data, error } = await (supabase as SupabaseClient)
    .from('mission_combatants' as never)
    .select('combatant_ref, frozen_price, frozen_image_url' as never)
    .eq('mission_id' as never, missionId as never)

  if (error || !data) return report

  const byRef = new Map<number, CombatantExtras>()
  for (const row of data as unknown as Array<Record<string, unknown>>) {
    const ref = typeof row.combatant_ref === 'number' ? row.combatant_ref : Number(row.combatant_ref)
    if (!Number.isFinite(ref)) continue
    byRef.set(ref, {
      frozen_price:
        row.frozen_price != null && row.frozen_price !== ''
          ? (row.frozen_price as number | string)
          : null,
      frozen_image_url:
        typeof row.frozen_image_url === 'string' ? row.frozen_image_url : null,
    })
  }

  if (byRef.size === 0) return report

  const win_rate_field: WinRateFieldRow[] = report.win_rate_field.map((row) => {
    const extra = byRef.get(row.combatant_ref)
    if (!extra) return row
    return {
      ...row,
      frozen_price: row.frozen_price ?? extra.frozen_price,
      image_url: row.image_url ?? extra.frozen_image_url,
    }
  })

  return { ...report, win_rate_field }
}
