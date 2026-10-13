import type { CheckoutThumb } from '@/lib/checkout/payment'

export default function CheckoutThumbFigure({
  item,
  size,
}: {
  item: CheckoutThumb
  size: 'stage' | 'quiet'
}) {
  const letter = item.name.trim().charAt(0).toUpperCase() || (item.kind === 'design' ? 'A' : '·')
  return (
    <figure className={size === 'stage' ? 'checkout-pack' : 'checkout-face'}>
      {item.imageUrl ? (
        // Study media can use remote catalog URLs that must not be server-fetched.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.imageUrl} alt="" />
      ) : (
        <div className="checkout-pack-fallback" aria-hidden>
          {letter}
        </div>
      )}
      <figcaption>{item.name}</figcaption>
    </figure>
  )
}
