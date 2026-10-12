export default function FieldBattleLine({
  singleTestMode,
  productCount,
  battles,
}: {
  singleTestMode: boolean
  productCount: number
  battles: number
}) {
  if (singleTestMode || battles <= 0) return null
  return (
    <p className="cb-field-battles">
      {productCount} products → {battles}{' '}
      {battles === 1 ? 'battle' : 'battles'} per respondent
    </p>
  )
}
