'use client'

import { useState, useTransition } from 'react'
import { formatOrderMoney } from '@/lib/checkout/money'
import { setStudyPriceAction } from '../../checkoutActions'
import { centsToDollars } from './centsToDollars'

type Props = {
  unitPriceCents: number | null
  currency: string
}

export default function StudyCheckoutPriceForm({ unitPriceCents, currency }: Props) {
  const [dollars, setDollars] = useState(
    unitPriceCents != null ? centsToDollars(unitPriceCents) : ''
  )
  const [priceError, setPriceError] = useState<string | null>(null)
  const [priceNote, setPriceNote] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const current =
    unitPriceCents != null ? formatOrderMoney(unitPriceCents, currency || 'usd') : null

  return (
    <form
      className="checkout-desk-price"
      onSubmit={(event) => {
        event.preventDefault()
        setPriceError(null)
        setPriceNote(null)
        startTransition(async () => {
          const result = await setStudyPriceAction({ dollars })
          if (!result.ok) {
            setPriceError(result.error)
            return
          }
          setPriceNote('Saved. This applies to new orders only.')
        })
      }}
    >
      <h3>Pricing</h3>
      <p>
        {current
          ? `${current} per completed response. A change applies to new orders only.`
          : 'No concept price is set.'}
      </p>
      <label>
        New price per completed response
        <input
          value={dollars}
          onChange={(event) => setDollars(event.target.value)}
          inputMode="decimal"
          required
        />
      </label>
      <button type="submit" disabled={pending || unitPriceCents == null}>
        {pending ? 'Saving…' : 'Change price'}
      </button>
      {priceError ? <p className="checkout-desk-error">{priceError}</p> : null}
      {priceNote ? <p className="checkout-desk-done">{priceNote}</p> : null}
    </form>
  )
}
