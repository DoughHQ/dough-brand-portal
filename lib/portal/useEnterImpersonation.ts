'use client'

import { useRouter } from 'next/navigation'
import { useState, useCallback } from 'react'
import { enterImpersonationAction } from '@/app/(portal)/admin/impersonation/actions'

export function useEnterImpersonation() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const enterAsBrand = useCallback(
    async (brandId: number, navigateTo = '/dashboard') => {
      setLoading(true)
      try {
        const result = await enterImpersonationAction(brandId)
        if (!result.ok) {
          return result
        }
        router.refresh()
        router.push(navigateTo)
        return result
      } finally {
        setLoading(false)
      }
    },
    [router]
  )

  return { enterAsBrand, loading }
}
