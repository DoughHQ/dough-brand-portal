export function PrototypesEmpty({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="proto-empty">
      <div className="proto-empty-eyebrow">Your first unreleased product</div>
      <h2 className="proto-empty-title">Build the library before you ship the box</h2>
      <p className="proto-empty-copy">
        Name it, mark plain sample or final packaging, add a photo, and declare allergens.
        When seating opens, every ready prototype is one tap away.
      </p>
      <button type="button" className="proto-primary-btn" onClick={onAdd}>
        Add prototype
      </button>
    </div>
  )
}
