import type { BoxFieldRow } from '@/lib/box/types'
import { barcodeChoiceLabel } from '@/lib/concept/barcodes'

const legendStyle = {
  fontFamily: 'var(--font-sans)' as const,
  fontSize: 12,
  fontWeight: 500,
  color: 'var(--ink-50)',
  marginBottom: 6,
}

export default function UpcChoiceList({
  row,
  options,
  onSelectUpc,
}: {
  row: BoxFieldRow
  options: NonNullable<BoxFieldRow['barcodeOptions']>
  onSelectUpc: (upc: string) => void
}) {
  return (
    <fieldset style={{ border: 'none', margin: 0, padding: 0 }}>
      <legend style={legendStyle}>Which barcode is on the package that ships?</legend>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {options.map((opt) => (
          <label
            key={opt.barcode}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              fontSize: 13,
              color: 'var(--ink-80)',
              cursor: 'pointer',
            }}
          >
            <input
              type="radio"
              name={`box-upc-${row.localId}`}
              value={opt.barcode}
              checked={row.upc === opt.barcode}
              onChange={() => onSelectUpc(opt.barcode)}
              style={{ marginTop: 3 }}
            />
            <span>
              {opt.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={opt.image_url}
                  alt=""
                  width={20}
                  height={20}
                  style={{
                    width: 20,
                    height: 20,
                    objectFit: 'contain',
                    verticalAlign: 'middle',
                    marginRight: 6,
                    background: 'var(--surface-1)',
                    borderRadius: 3,
                  }}
                />
              ) : null}
              {barcodeChoiceLabel(opt)}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
