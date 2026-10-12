'use client'

import { useEffect, useRef } from 'react'
import { formatOrderMoney } from '@/lib/checkout/money'
import { checkoutWindowFacts } from '@/lib/checkout/windowFacts'
import { checkoutHero, checkoutHeroDesignLabel } from '@/lib/concept/checkoutHero'
import type { ConceptPublishSuccessMeta, ConceptStudyDraft } from '@/lib/concept/types'

export function useCheckoutHandoff(
  draft: ConceptStudyDraft,
  meta: ConceptPublishSuccessMeta,
  onClose: () => void,
) {
  const panelRef = useRef<HTMLDivElement>(null)
  const continueRef = useRef<HTMLButtonElement>(null)
  const hero = checkoutHero(draft.conceptArms)
  const name = hero?.display_name.trim() || ''
  const design = checkoutHeroDesignLabel(draft.conceptArms)
  const mark = design?.replace(/^Design\s+/i, '') || 'A'
  const completions = meta.target_completions ?? draft.targetCompletions
  const amount =
    meta.order?.amount_cents != null && meta.order.currency
      ? formatOrderMoney(meta.order.amount_cents, meta.order.currency)
      : null
  const facts = checkoutWindowFacts({
    completions,
    fieldingDays: draft.fieldingDays,
    expiresAt: null,
    settled: false,
  })

  useEffect(() => {
    continueRef.current?.focus()
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key !== 'Tab') return
      const focusables = panelRef.current?.querySelectorAll<HTMLElement>('button')
      if (!focusables?.length) return
      const first = focusables[0]!
      const last = focusables[focusables.length - 1]!
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return { panelRef, continueRef, hero, name, design, mark, amount, facts }
}
