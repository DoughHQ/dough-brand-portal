import type { MastheadAddSeat } from '@/lib/concept/studyMasthead'

export default function MastheadAddTile({
  seat,
  disabled,
  onClick,
}: {
  seat: MastheadAddSeat
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className="cb-masthead-tile is-add"
      onClick={onClick}
      disabled={disabled}
    >
      <span className="cb-masthead-photo is-add" aria-hidden>
        <span className="cb-masthead-plus" />
      </span>
      <span className="cb-masthead-copy">
        <strong>{seat.label}</strong>
        <span>{seat.hint}</span>
      </span>
    </button>
  )
}
