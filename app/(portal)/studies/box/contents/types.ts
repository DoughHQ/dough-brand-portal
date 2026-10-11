import type { BoxFieldRow } from '@/lib/box/types'

/** Transient add/replace — never written into the draft until resolved. */
export type Composer =
  | null
  | {
      intent: 'yours_catalog' | 'yours_prototype' | 'competitor_catalog'
      replaceLocalId?: string
      /** Snapshot so Change can cancel without data loss. */
      previous?: BoxFieldRow
    }

export type ComposerIntent = NonNullable<Composer>['intent']
