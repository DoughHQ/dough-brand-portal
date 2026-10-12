'use client'

import type { ConceptPublishSuccessMeta, ConceptStudyDraft } from '@/lib/concept/types'
import HandoffCloseMark from './handoff/HandoffCloseMark'
import HandoffFacts from './handoff/HandoffFacts'
import HandoffHero from './handoff/HandoffHero'
import { useCheckoutHandoff } from './handoff/useCheckoutHandoff'

type Props = {
  draft: ConceptStudyDraft
  meta: ConceptPublishSuccessMeta
  onClose: () => void
  onContinue: () => void
}

export { default as AwaitingPaymentNotice } from './handoff/AwaitingPaymentNotice'

export default function CheckoutHandoff({ draft, meta, onClose, onContinue }: Props) {
  const handoff = useCheckoutHandoff(draft, meta, onClose)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-handoff-title"
      className="cb-confirm-overlay"
    >
      <div className="cb-confirm-panel cb-handoff" ref={handoff.panelRef}>
        <div className="cb-handoff-head">
          <h2 id="checkout-handoff-title" className="cb-confirm-title">
            Ready for checkout
          </h2>
          <button type="button" className="cb-icon-btn" aria-label="Close" onClick={onClose}>
            <HandoffCloseMark />
          </button>
        </div>
        <p className="cb-confirm-body">Nothing goes live until this is paid.</p>
        {handoff.hero ? (
          <HandoffHero
            hero={handoff.hero}
            name={handoff.name}
            design={handoff.design}
            mark={handoff.mark}
          />
        ) : null}
        <HandoffFacts facts={handoff.facts} amount={handoff.amount} />
        <div className="cb-confirm-actions">
          <button type="button" className="cb-btn-outline" onClick={onClose}>
            Not now
          </button>
          <button
            type="button"
            ref={handoff.continueRef}
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
