'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { enterImpersonationAction } from '../admin/impersonation/actions'
import { parseImpersonatedBrandIdFromAccessToken } from '@/lib/portal/parseImpersonationClaim'

interface Props {
  isAdmin: boolean
  isImpersonating: boolean
  children: React.ReactNode
}

/**
 * Legacy deep-link handler: ?brand_id=X without an active JWT claim.
 * Shows explicit confirm UI — never scopes data from the URL param.
 */
export default function LegacyBrandIdGate({
  isAdmin,
  isImpersonating,
  children,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [pendingBrandId, setPendingBrandId] = useState<number | null>(null)
  const [brandName, setBrandName] = useState<string | null>(null)
  const [entering, setEntering] = useState(false)

  const brandIdParam = searchParams.get('brand_id')
  const parsedBrandId = brandIdParam ? parseInt(brandIdParam, 10) : NaN

  useEffect(() => {
    if (!isAdmin || !Number.isFinite(parsedBrandId)) return

    const supabase = createClient()

    async function handleLegacyParam() {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const claim = session?.access_token
        ? parseImpersonatedBrandIdFromAccessToken(session.access_token)
        : null

      if (claim === parsedBrandId || isImpersonating) {
        stripParam()
        return
      }

      const { data } = await supabase
        .from('brands')
        .select('brand_name')
        .eq('brand_id', parsedBrandId)
        .maybeSingle()

      setBrandName(data?.brand_name ?? `Brand ${parsedBrandId}`)
      setPendingBrandId(parsedBrandId)
    }

    function stripParam() {
      const params = new URLSearchParams(searchParams.toString())
      params.delete('brand_id')
      const q = params.toString()
      router.replace(q ? `${pathname}?${q}` : pathname)
    }

    void handleLegacyParam()
  }, [isAdmin, isImpersonating, parsedBrandId, pathname, router, searchParams])

  async function handleEnter() {
    if (pendingBrandId == null) return
    setEntering(true)
    try {
      const result = await enterImpersonationAction(pendingBrandId)
      if (!result.ok) {
        setPendingBrandId(null)
        return
      }
      setPendingBrandId(null)
      const params = new URLSearchParams(searchParams.toString())
      params.delete('brand_id')
      const q = params.toString()
      router.replace(q ? `${pathname}?${q}` : pathname)
      router.refresh()
    } finally {
      setEntering(false)
    }
  }

  function handleCancel() {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('brand_id')
    const q = params.toString()
    router.replace(q ? `${pathname}?${q}` : pathname)
    setPendingBrandId(null)
  }

  if (pendingBrandId != null) {
    return (
      <div
        style={{
          margin: '24px 32px',
          padding: '20px 24px',
          background: 'var(--amber-pale)',
          border: '1px solid rgba(192,120,24,0.2)',
          borderRadius: 'var(--r-md)',
          maxWidth: 520,
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--ink)',
            marginBottom: 8,
          }}
        >
          View as {brandName}?
        </div>
        <p
          style={{
            fontSize: 13,
            color: 'var(--ink-50)',
            lineHeight: 1.5,
            margin: '0 0 16px',
          }}
        >
          Enter impersonation to see this brand&apos;s portal experience. This will not
          happen automatically.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={handleEnter}
            disabled={entering}
            style={{
              padding: '10px 16px',
              background: 'var(--sage)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--r-sm)',
              fontSize: 13,
              fontWeight: 500,
              cursor: entering ? 'default' : 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {entering ? 'Entering…' : 'Enter impersonation'}
          </button>
          <button
            onClick={handleCancel}
            disabled={entering}
            style={{
              padding: '10px 16px',
              background: 'white',
              color: 'var(--ink)',
              border: '1px solid var(--ink-10)',
              borderRadius: 'var(--r-sm)',
              fontSize: 13,
              fontWeight: 500,
              cursor: entering ? 'default' : 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
