import type { CheckoutWindowFacts } from '@/lib/checkout/windowFacts'

export default function HandoffFacts({
  facts,
  amount,
}: {
  facts: CheckoutWindowFacts
  amount: string | null
}) {
  return (
    <dl className="cb-handoff-facts">
      <div>
        <dt>Completions</dt>
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
      <div>
        <dt>Total</dt>
        <dd>{amount ?? '—'}</dd>
      </div>
    </dl>
  )
}
