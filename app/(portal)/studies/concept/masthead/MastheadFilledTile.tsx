import type { MastheadFilledSeat } from '@/lib/concept/studyMasthead'
import MastheadShelfPhoto from './MastheadShelfPhoto'

export default function MastheadFilledTile({
  seat,
  onFocus,
}: {
  seat: MastheadFilledSeat
  onFocus: () => void
}) {
  const subtitle =
    seat.kind === 'arm' ? `Design ${seat.letter}` : seat.brand || 'Competitor'
  return (
    <button type="button" className="cb-masthead-tile" onClick={onFocus}>
      {seat.kind === 'arm' ? (
        <MastheadShelfPhoto imageRef={seat.imageRef} letter={seat.letter} />
      ) : (
        <MastheadShelfPhoto src={seat.imageSrc} letter={seat.name.slice(0, 1).toUpperCase() || 'C'} />
      )}
      <span className="cb-masthead-copy">
        <strong>{seat.name}</strong>
        <span>{subtitle}</span>
      </span>
    </button>
  )
}
