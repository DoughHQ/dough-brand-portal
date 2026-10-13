import { MAX_BOX_FIELD_SIZE } from '@/lib/box/fieldSize'
import type { Composer } from './types'

type Props = {
  composer: Composer
  rowCount: number
  canAdd: boolean
  overBy: number
  missingUpcCount: number
  unconfirmedCount: number
}

export default function ContentsFieldNotes({
  composer,
  rowCount,
  canAdd,
  overBy,
  missingUpcCount,
  unconfirmedCount,
}: Props) {
  return (
    <>
      {!composer && !canAdd ? (
        <p className="cb-field-note" style={{ margin: '16px 0 0' }}>
          Field full · {MAX_BOX_FIELD_SIZE} of {MAX_BOX_FIELD_SIZE}
        </p>
      ) : null}

      <p className="cb-field-note" style={{ marginTop: 12 }}>
        {rowCount} of {MAX_BOX_FIELD_SIZE} seat{rowCount === 1 ? '' : 's'} in the
        box
        {rowCount < 2 ? ' · at least 2 needed' : ''}
        {overBy > 0
          ? ` · remove ${overBy} to fit`
          : !canAdd && rowCount >= 2
            ? ' · full round-robin (10 battles)'
            : ''}
        {missingUpcCount > 0 ? ' · UPC required per catalog product' : ''}
        {unconfirmedCount > 0 ? ' · confirm each catalog product' : ''}
      </p>
    </>
  )
}
