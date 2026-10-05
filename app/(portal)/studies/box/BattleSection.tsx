'use client'

/**
 * @deprecated Free battle prompt UI retired for IHUT_CORE_V1.
 * Box builder mounts MethodSection ("Questions") with locked dual-track prompts.
 * Do not remount this component.
 */

import type { BoxStudyDraft } from '@/lib/box/types'

type Props = {
  draft: BoxStudyDraft
  onChange: (next: BoxStudyDraft) => void
  sectionDone?: boolean
}

export default function BattleSection(_props: Props) {
  return null
}
