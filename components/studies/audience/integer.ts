/** Integer-only. Decimals would fail the RPC's smallint/integer casts. */
export function intFromInput(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed || !/^-?\d+$/.test(trimmed)) return null
  const parsed = Number(trimmed)
  return Number.isSafeInteger(parsed) ? parsed : null
}
