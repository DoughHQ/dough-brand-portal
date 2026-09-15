import 'server-only'

import { cache } from 'react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { logHandledRpcFailure } from '@/lib/portal/logHandledRpcFailure'
import {
  badgesFromSnapshot,
  EMPTY_ADMIN_HOME_SNAPSHOT,
  parseAdminHomeSnapshot,
} from './parseAdminHomeSnapshot'
import type { AdminHomeSnapshot, AdminQueueBadges } from './types'

/**
 * Single admin-home document. Layout badges and the dashboard page share this
 * via React.cache() — one RPC per request, never a fan-out of list RPCs.
 */
export const getAdminHomeSnapshot = cache(async (): Promise<AdminHomeSnapshot> => {
  const now = new Date()
  try {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.rpc('get_admin_home_snapshot')
    if (error) {
      logHandledRpcFailure('get_admin_home_snapshot', {
        code: error.code ?? null,
        message: error.message,
        details: error.details ?? null,
        hint: error.hint ?? null,
        reason: 'admin_home',
      })
      return { ...EMPTY_ADMIN_HOME_SNAPSHOT, generatedAt: now.toISOString() }
    }
    return parseAdminHomeSnapshot(data, now)
  } catch (err) {
    logHandledRpcFailure('get_admin_home_snapshot', {
      code: null,
      message: err instanceof Error ? err.message : String(err),
      details: null,
      hint: null,
      reason: 'admin_home',
    })
    return { ...EMPTY_ADMIN_HOME_SNAPSHOT, generatedAt: now.toISOString() }
  }
})

export const getAdminQueueBadges = cache(async (): Promise<AdminQueueBadges> => {
  const snapshot = await getAdminHomeSnapshot()
  return badgesFromSnapshot(snapshot)
})
