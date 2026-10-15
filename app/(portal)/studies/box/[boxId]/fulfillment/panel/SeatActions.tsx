import {
  brandActionsFor,
  fulfillmentActionLabel,
  fulfillmentWaitingCopy,
  type BrandFulfillmentRow,
  type ShipHolds,
} from '@/lib/box/brandFulfillment'
import { miniBtn } from './panelStyles'
import type { BrandFulfillmentState } from './useBrandFulfillment'

export function SeatActions({
  r,
  actions,
  waiting,
  hold,
  shipping,
  pending,
  setShipFor,
  setConfirm,
  run,
}: {
  r: BrandFulfillmentRow
  actions: ReturnType<typeof brandActionsFor>
  waiting: ReturnType<typeof fulfillmentWaitingCopy>
  hold: ShipHolds[string] | null
  shipping: boolean
} & Pick<BrandFulfillmentState, 'pending' | 'setShipFor' | 'setConfirm' | 'run'>) {
  return (
    actions.length > 0 || waiting ? (
      <div
        style={{
          display: 'flex',
          gap: 8,
          flexShrink: 0,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        {waiting ? (
          <span style={{ fontSize: 11, color: 'var(--ink-30)' }}>{waiting}</span>
        ) : null}
        {actions.map((a) => {
          const danger = a === 'delivery_failed'
          if (a === 'shipped') {
            return (
              <button
                key={a}
                type="button"
                disabled={pending}
                onClick={() => setShipFor(shipping ? null : r.fulfillment_id)}
                style={miniBtn(false)}
              >
                {fulfillmentActionLabel(a)}
              </button>
            )
          }
          if (a === 'delivered' || a === 'delivery_failed') {
            return (
              <button
                key={a}
                type="button"
                disabled={pending}
                onClick={() =>
                  setConfirm({ fulfillmentId: r.fulfillment_id, target: a })
                }
                style={miniBtn(danger)}
              >
                {fulfillmentActionLabel(a)}
              </button>
            )
          }
          return (
            <button
              key={a}
              type="button"
              disabled={pending}
              onClick={() => run(r.fulfillment_id, a)}
              style={miniBtn(danger)}
            >
              {fulfillmentActionLabel(a)}
            </button>
          )
        })}
      </div>
    ) : hold ? null : r.left_at ? (
      <span style={{ fontSize: 11, color: 'var(--ink-30)', flexShrink: 0 }}>
        Left by respondent
      </span>
    ) : (
      <span style={{ fontSize: 11, color: 'var(--ink-30)', flexShrink: 0 }}>
        {r.state === 'claim_expired' ? 'Sweep-driven' : 'Respondent-driven'}
      </span>
    )
  )
}
