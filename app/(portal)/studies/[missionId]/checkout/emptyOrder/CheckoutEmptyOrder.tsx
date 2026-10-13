import Link from 'next/link'

export default function CheckoutEmptyOrder() {
  return (
    <div className="checkout-page">
      <Link href="/studies" className="checkout-back">
        ← Studies
      </Link>
      <h1 className="checkout-title">No order</h1>
      <p className="checkout-lede">This study has no order you can see.</p>
    </div>
  )
}
