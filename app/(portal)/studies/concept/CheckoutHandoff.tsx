'use client'

import { useEffect, useRef, useState } from 'react'
import { formatOrderMoney } from '@/lib/checkout/money'
import { checkoutHero } from '@/lib/concept/checkoutHero'
import { createClient } from '@/lib/supabase'
import { resolveStimuliPreviewUrl } from '@/lib/concept/stimuliStorage'
import type { ConceptPublishSuccessMeta, ConceptStudyDraft } from '@/lib/concept/types'
import { fieldingDaysMessage, fieldingEndDateLabel } from '@/lib/studies/fieldingWindow'

type Props = {
  draft: ConceptStudyDraft
  meta: ConceptPublishSuccessMeta
  onClose: () => void
  onContinue: () => void
}

export default function CheckoutHandoff({ draft, meta, onClose, onContinue }: Props) {
  const panelRef = useRef<HTMLDivElement>(null)
  const continueRef = useRef<HTMLButtonElement>(null)
  const hero = checkoutHero(draft.conceptArms)
  const name = hero?.display_name.trim() || ''
  const letter = hero?.arm_label.trim() || ''
  const design = letter ? `Design ${letter}` : 'Your product'
  const completions = meta.target_completions ?? draft.targetCompletions
  const amount =
    meta.order?.amount_cents != null && meta.order.currency
      ? formatOrderMoney(meta.order.amount_cents, meta.order.currency)
      : null
  const days = fieldingDaysMessage(draft.fieldingDays) ? null : draft.fieldingDays
  const endValue = days == null ? 'No end date' : fieldingEndDateLabel(days)
  const endNote = days == null ? 'Until responses are in' : 'If paid today'

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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-handoff-title"
      className="cb-confirm-overlay"
    >
      <div className="cb-confirm-panel cb-handoff" ref={panelRef}>
        <div className="cb-handoff-head">
          <h2 id="checkout-handoff-title" className="cb-confirm-title">
            Ready for checkout
          </h2>
          <button type="button" className="cb-icon-btn" aria-label="Close" onClick={onClose}>
            <CloseMark />
          </button>
        </div>
        <p className="cb-confirm-body">Nothing goes live until this is paid.</p>
        {hero ? (
          <div className="cb-handoff-hero">
            <HeroPhoto imageRef={hero.image_url} letter={letter || 'A'} />
            <div>
              <p className="cb-handoff-name">{name || design}</p>
              {name ? <p className="cb-handoff-design">{design}</p> : null}
            </div>
          </div>
        ) : null}
        <dl className="cb-handoff-facts">
          <div>
            <dt>Completions</dt>
            <dd>{completions.toLocaleString('en-US')}</dd>
          </div>
          <div>
            <dt>Ends</dt>
            <dd>
              {endValue}
              <small>{endNote}</small>
            </dd>
          </div>
          <div>
            <dt>Total</dt>
            <dd>{amount ?? '—'}</dd>
          </div>
        </dl>
        <div className="cb-confirm-actions">
          <button type="button" className="cb-btn-outline" onClick={onClose}>
            Not now
          </button>
          <button
            type="button"
            ref={continueRef}
            className="cb-btn cb-btn-primary"
            onClick={onContinue}
          >
            Continue to checkout
          </button>
        </div>
      </div>
    </div>
  )
}

export function AwaitingPaymentNotice({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="cb-awaiting" role="status">
      <div>
        <p className="cb-awaiting-title">Awaiting payment</p>
        <p className="cb-awaiting-body">
          This order is in. Changes here do not change the study.
        </p>
      </div>
      <button type="button" className="cb-btn cb-btn-primary" onClick={onContinue}>
        Continue to checkout
      </button>
    </div>
  )
}

function HeroPhoto({ imageRef, letter }: { imageRef: string | null; letter: string }) {
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    if (!imageRef) {
      setSrc(null)
      return
    }
    const supabase = createClient()
    void resolveStimuliPreviewUrl(supabase, imageRef).then((url) => {
      if (!cancelled) setSrc(url)
    })
    return () => {
      cancelled = true
    }
  }, [imageRef])

  if (!src) {
    return (
      <div className="cb-handoff-letter" aria-hidden>
        {letter}
      </div>
    )
  }
  return <img className="cb-handoff-photo" src={src} alt="" />
}

function CloseMark() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
      <path
        d="M2 2l8 8M10 2L2 10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}
