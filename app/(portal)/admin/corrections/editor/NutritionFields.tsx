export const NUTRITION_FIELDS: Array<{ key: string; label: string; step?: string }> = [
  { key: 'serving_size_value', label: 'Serving size' },
  { key: 'serving_size_uom', label: 'UOM' },
  { key: 'servings_per_container', label: 'Servings/container' },
  { key: 'calories', label: 'Calories' },
  { key: 'total_fat_g', label: 'Total fat (g)' },
  { key: 'saturated_fat_g', label: 'Sat fat (g)' },
  { key: 'trans_fat_g', label: 'Trans fat (g)' },
  { key: 'cholesterol_mg', label: 'Cholesterol (mg)' },
  { key: 'sodium_mg', label: 'Sodium (mg)' },
  { key: 'total_carbs_g', label: 'Carbs (g)' },
  { key: 'dietary_fiber_g', label: 'Fiber (g)' },
  { key: 'total_sugars_g', label: 'Sugars (g)' },
  { key: 'added_sugars_g', label: 'Added sugars (g)' },
  { key: 'protein_g', label: 'Protein (g)' },
  { key: 'vitamin_d_mcg', label: 'Vitamin D (mcg)' },
  { key: 'calcium_mg', label: 'Calcium (mg)' },
  { key: 'iron_mg', label: 'Iron (mg)' },
  { key: 'potassium_mg', label: 'Potassium (mg)' },
  { key: 'vitamin_a_mcg', label: 'Vitamin A (mcg)' },
  { key: 'vitamin_c_mg', label: 'Vitamin C (mg)' },
]

export function NutritionFields({
  draft,
  setField,
  hint,
}: {
  draft: Record<string, unknown>
  setField: (key: string, value: unknown) => void
  hint: string | null
}) {
  return (
    <>
      <div className="corr-editor-basis">
        <div className="corr-editor-basis-label">
          Basis <span className="corr-editor-req">*</span> — required. Confirm against the photo.
        </div>
        <div className="corr-editor-chips">
          {(['per_serving', 'per_100g', 'per_100ml'] as const).map((b) => {
            const selected = draft.basis_type === b
            return (
              <button
                key={b}
                type="button"
                className={selected ? 'corr-editor-chip is-on' : 'corr-editor-chip'}
                onClick={() => setField('basis_type', b)}
              >
                {b === 'per_serving' ? 'Per serving' : b === 'per_100g' ? 'Per 100g' : 'Per 100ml'}
              </button>
            )
          })}
        </div>
      </div>
      {hint && <div className="corr-editor-warn">{hint}</div>}
      <div className="corr-editor-nutrition">
        {NUTRITION_FIELDS.map((f) => (
          <label key={f.key} className="corr-editor-label">
            {f.label}
            <input
              className="corr-editor-input"
              value={draft[f.key] == null ? '' : String(draft[f.key])}
              onChange={(e) => setField(f.key, e.target.value)}
            />
          </label>
        ))}
      </div>
    </>
  )
}
