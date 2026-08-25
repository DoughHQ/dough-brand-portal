'use client'

import { useRouter } from 'next/navigation'
import { useState, useCallback } from 'react'
import { enterImpersonationAction } from '@/app/(portal)/admin/impersonation/actions'
import { perfLog, perfNow } from '@/lib/perf'

export function useEnterImpersonation() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const enterAsBrand = useCallback(
    async (brandId: number, navigateTo = '/dashboard') => {
      setLoading(true)
      const t0 = perfNow()
      try {
        const tAction = perfNow()
        const result = await enterImpersonationAction(brandId)
        perfLog('enter.client.action', perfNow() - tAction, { ok: result.ok })
        if (!result.ok) {
          return result
        }
        // Action already refreshSession()'d cookies once. Do NOT router.refresh()
        // before push — that re-renders the current page RSC, then dashboard
        // loads again (double full tree). Push alone picks up the new claim.
        const tNav = perfNow()
        router.push(navigateTo)
        perfLog('enter.client.push', perfNow() - tNav, { to: navigateTo })
        perfLog('enter.client.total', perfNow() - t0, { brandId })
        return result
      } finally {
        setLoading(false)
      }
    },
    [router]
  )

  return { enterAsBrand, loading }
}
