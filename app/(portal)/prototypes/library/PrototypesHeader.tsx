export function PrototypesHeader({ brandName, onAdd }: { brandName: string; onAdd: () => void }) {
  return (
    <header className="cat-header">
      <div className="cat-header-copy">
        <h1 className="cat-title">Prototypes</h1>
        <p className="cat-lede">
          Unreleased products for {brandName}. Private library — never the public catalog.
          Ready samples (photo + allergens) can be seated in an IHUT box study.
        </p>
      </div>
      <div className="prod-header-actions">
        <button type="button" className="proto-primary-btn" onClick={onAdd}>
          Add prototype
        </button>
      </div>
    </header>
  )
}
