import { request } from '@playwright/test'

export const VERCEL_BYPASS_STATE = 'e2e/.auth/vercel-bypass.json'

/**
 * Preview deploys sit behind Vercel Deployment Protection. One request with the
 * automation secret sets a bypass cookie for the preview host, and every test
 * reuses it. A header on every browser request would also reach Supabase.
 */
export default async function vercelBypass() {
  const secret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET
  const baseURL = process.env.PLAYWRIGHT_BASE_URL
  if (!secret || !baseURL) return

  const context = await request.newContext({
    baseURL,
    extraHTTPHeaders: {
      'x-vercel-protection-bypass': secret,
      'x-vercel-set-bypass-cookie': 'true',
    },
  })
  // A valid secret answers 307 with the cookie and redirects back to the
  // preview. A bad one redirects to Vercel's login.
  const response = await context.get('/login')
  const landedHost = new URL(response.url()).host
  if (!response.ok() || landedHost !== new URL(baseURL).host) {
    throw new Error(
      `Vercel protection bypass failed: ${response.status()} at ${landedHost}`
    )
  }
  await context.storageState({ path: VERCEL_BYPASS_STATE })
  await context.dispose()
}
