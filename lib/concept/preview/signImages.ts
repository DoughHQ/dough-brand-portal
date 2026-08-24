import { createClient } from '@/lib/supabase'
import {
  isDisplayableImageUrl,
  resolveStimuliPreviewUrl,
} from '@/lib/concept/stimuliStorage'
import type { PreviewCombatant } from './combatants'

/**
 * Sign / pass-through every combatant image once at walkthrough start.
 * Renderer only ever sees a displayable https URL or null — never a
 * `concept-stimuli/...` storage ref.
 */
export async function signCombatantImages(
  combatants: PreviewCombatant[]
): Promise<PreviewCombatant[]> {
  const supabase = createClient()
  return Promise.all(
    combatants.map(async (c) => {
      const display = await resolveStimuliPreviewUrl(supabase, c.image_url)
      const url = isDisplayableImageUrl(display) ? display : null
      return {
        ...c,
        image_url: url,
        image_unavailable: !url,
      }
    })
  )
}
