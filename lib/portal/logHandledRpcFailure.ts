/**
 * Handled RPC miss — not a crash. Use console.log (not console.error):
 * Next 16 RSC + Turbopack promotes console.error to a red overlay.
 */
export type HandledRpcLog = {
  code: string | null
  message: string | null
  details: string | null
  hint: string | null
  brandId?: number | null
  reason?: string
  rawCount?: number
}

export function logHandledRpcFailure(rpcName: string, payload: HandledRpcLog): void {
  console.log(`[rpc:handled] ${rpcName} ${JSON.stringify(payload)}`)
}
