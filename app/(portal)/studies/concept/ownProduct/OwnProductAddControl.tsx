import type { AddAvailability } from '@/lib/concept/fieldSize'

type Props = {
  singleTestMode: boolean
  disabled?: boolean
  addVariant: AddAvailability
  onAdd: () => void
}

export default function OwnProductAddControl({
  singleTestMode,
  disabled,
  addVariant,
  onAdd,
}: Props) {
  return (
    <>
      <button
        type="button"
        className={singleTestMode ? 'cb-concept-add' : 'cb-btn-outline'}
        onClick={onAdd}
        disabled={disabled || !addVariant.allowed}
        aria-describedby={addVariant.allowed ? undefined : 'cb-add-variant-reason'}
      >
        {singleTestMode ? '+ Add another concept' : '+ Add another variant'}
      </button>
      {!addVariant.allowed ? (
        <p
          id="cb-add-variant-reason"
          style={{
            margin: '8px 0 0',
            fontSize: 12,
            color: 'var(--ink-50)',
            lineHeight: 1.45,
          }}
        >
          {addVariant.message}
        </p>
      ) : null}
    </>
  )
}
