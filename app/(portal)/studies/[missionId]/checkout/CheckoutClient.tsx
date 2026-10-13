'use client'

import Link from 'next/link'
import './checkout.css'
import CheckoutOrderCard from './desk/CheckoutOrderCard'
import CheckoutReportChapters from './desk/CheckoutReportChapters'
import CheckoutStudyPanel from './desk/CheckoutStudyPanel'
import { useCheckoutDesk, type CheckoutClientProps } from './desk/useCheckoutDesk'

export default function CheckoutClient(props: CheckoutClientProps) {
  const desk = useCheckoutDesk(props)

  return (
    <div className="checkout-page">
      <Link href="/studies" className="checkout-back">
        ← Studies
      </Link>
      <p className="checkout-kicker">Checkout</p>
      <h1 className="checkout-title">{props.order.title}</h1>
      <p className="checkout-lede">
        {desk.settled
          ? 'This study is live.'
          : 'A blind read of these packs, from real shoppers.'}
      </p>

      <div className="checkout-grid">
        <div>
          <CheckoutStudyPanel
            designs={props.designs}
            products={props.products}
            facts={desk.facts}
          />
          <CheckoutReportChapters missionId={props.order.mission_id} />
        </div>

        <CheckoutOrderCard
          order={props.order}
          requested={desk.requested}
          setRequested={desk.setRequested}
          unit={desk.unit}
          total={desk.total}
          when={desk.when}
          invoiceEmail={desk.invoiceEmail}
          settled={desk.settled}
        />
      </div>
    </div>
  )
}
