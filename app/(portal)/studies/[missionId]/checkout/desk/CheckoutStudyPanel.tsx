import type { CheckoutWindowFacts } from '@/lib/checkout/windowFacts'
import type { CheckoutThumb } from '@/lib/checkout/payment'
import CheckoutThumbFigure from './CheckoutThumbFigure'

type Props = {
  designs: CheckoutThumb[]
  products: CheckoutThumb[]
  facts: CheckoutWindowFacts
}

export default function CheckoutStudyPanel({ designs, products, facts }: Props) {
  return (
    <section className="checkout-panel" aria-label="The study">
      {designs.length > 0 ? (
        <>
          <h2>The packs</h2>
          <ul className="checkout-packs">
            {designs.map((item, index) => (
              <li key={`design-${index}`}>
                <CheckoutThumbFigure item={item} size="stage" />
              </li>
            ))}
          </ul>
        </>
      ) : null}
      {products.length > 0 ? (
        <>
          <h2 className={designs.length > 0 ? 'checkout-subhead' : undefined}>They face</h2>
          <ul className="checkout-faces">
            {products.map((item, index) => (
              <li key={`product-${index}`}>
                <CheckoutThumbFigure item={item} size="quiet" />
              </li>
            ))}
          </ul>
        </>
      ) : null}
      <dl className="checkout-facts">
        <div>
          <dt>Responses</dt>
          <dd>{facts.responses}</dd>
        </div>
        <div>
          <dt>Runs</dt>
          <dd>
            {facts.length}
            <small>{facts.lengthNote}</small>
          </dd>
        </div>
        <div>
          <dt>Ends</dt>
          <dd>
            {facts.end}
            <small>{facts.endNote}</small>
          </dd>
        </div>
      </dl>
    </section>
  )
}
