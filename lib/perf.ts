/**
 * Dev-facing timing for impersonation / portal navigation.
 * Logs only when NODE_ENV=development or DOUGH_PERF_LOG=1.
 */
export function perfEnabled(): boolean {
  return (
    process.env.NODE_ENV === 'development' ||
    process.env.DOUGH_PERF_LOG === '1' ||
    process.env.NEXT_PUBLIC_DOUGH_PERF_LOG === '1'
  )
}

export function perfNow(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now()
}

export function perfLog(label: string, ms: number, extra?: Record<string, unknown>) {
  if (!perfEnabled()) return
  const payload = extra ? ` ${JSON.stringify(extra)}` : ''
  console.log(`[perf] ${label}: ${Math.round(ms)}ms${payload}`)
}

export async function timed<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const t0 = perfNow()
  try {
    return await fn()
  } finally {
    perfLog(label, perfNow() - t0)
  }
}
