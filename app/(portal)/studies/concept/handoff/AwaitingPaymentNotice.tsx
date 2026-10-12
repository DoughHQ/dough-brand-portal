export default function AwaitingPaymentNotice({ onContinue }: { onContinue: () => void }) {
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
