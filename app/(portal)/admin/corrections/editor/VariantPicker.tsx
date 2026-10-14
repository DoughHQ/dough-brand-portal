export function VariantPicker({
  noVariants,
  needVariant,
  skuVariantId,
  setSkuVariantId,
  variants,
}: {
  noVariants: boolean
  needVariant: boolean
  skuVariantId: number | null
  setSkuVariantId: (value: number | null) => void
  variants: Array<{ sku_variant_id: number; label: string }>
}) {
  return (
    <>
      {noVariants && (
        <div className="corr-editor-warn">
          This product has no SKU variants — nutrition/ingredients cannot be applied.
        </div>
      )}

      {needVariant && (
        <label className="corr-editor-label">
          Variant
          <select
            className="corr-editor-input"
            value={skuVariantId ?? ''}
            onChange={(e) => setSkuVariantId(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">Select variant…</option>
            {variants.map((v) => (
              <option key={v.sku_variant_id} value={v.sku_variant_id}>{v.label}</option>
            ))}
          </select>
        </label>
      )}
    </>
  )
}
