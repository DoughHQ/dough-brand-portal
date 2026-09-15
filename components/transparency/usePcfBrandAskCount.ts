'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { fetchBrandProofAskCounts } from '@/lib/transparency/fetchBrandProofAskCounts'
import {
  selectPcfAsk,
  type BrandProofAskCount,
} from '@/lib/transparency/proofAskCounts'

/** undefined = loading (do not flash a zero badge). */
export function usePcfBrandAskCount(
  productId: number,
): BrandProofAskCount | null | undefined {
  const supabase = useMemo(() => createClient(), [])
  const [row, setRow] = useState<BrandProofAskCount | null | undefined>(
    undefined,
  )

  useEffect(() => {
    let cancelled = false
    setRow(undefined)
    void fetchBrandProofAskCounts(supabase, productId).then((rows) => {
      if (!cancelled) setRow(selectPcfAsk(rows))
    })
    return () => {
      cancelled = true
    }
  }, [productId, supabase])

  return row
}
