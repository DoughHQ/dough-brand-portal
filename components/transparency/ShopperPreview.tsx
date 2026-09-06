'use client'

type Props = {
  line: string
  whisper?: string | null
}

/** Live “what shoppers will read” strip — shared across composed editors. */
export default function ShopperPreview({ line, whisper }: Props) {
  if (!line.trim()) return null
  return (
    <div className="tx-origin__preview" aria-live="polite">
      <p className="tx-origin__preview-kicker">Shoppers will read</p>
      <p className="tx-origin__preview-line">{line}</p>
      {whisper ? <p className="tx-origin__preview-whisper">{whisper}</p> : null}
    </div>
  )
}
