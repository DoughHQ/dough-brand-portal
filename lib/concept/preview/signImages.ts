import { createClient } from '@/lib/supabase'
import { resolveStimuliPreviewUrl } from '@/lib/concept/stimuliStorage'
import type { PreviewCombatant } from './combatants'

export async function signCombatantImages(
  combatants: PreviewCombatant[]
): Promise<PreviewCombatant[]> {
  const supabase = createClient()
  return Promise.all(
    combatants.map(async (c) => {
      const signed = await resolveStimuliPreviewUrl(supabase, c.image_url)
      return {
        ...c,
        image_url: signed ?? c.image_url,
        image_unavailable: !signed && !c.image_url?.startsWith('http'),
      }
    })
  )
}
