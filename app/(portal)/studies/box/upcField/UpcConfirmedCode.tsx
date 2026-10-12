import { formatUpcDisplay } from '@/lib/concept/barcodes'
import BarcodeGlyph from './BarcodeGlyph'

export default function UpcConfirmedCode({
  upc,
  onChange,
}: {
  upc: string
  onChange: () => void
}) {
  return (
    <div className="cb-box-upc-confirmed">
      <span className="cb-box-upc-glyph" aria-hidden>
        <BarcodeGlyph />
      </span>
      <span className="cb-box-upc-code">{formatUpcDisplay(upc)}</span>
      <button
        type="button"
        className="cb-btn-outline cb-box-upc-edit"
        onClick={onChange}
      >
        Change
      </button>
    </div>
  )
}
