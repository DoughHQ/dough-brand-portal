import { describe, expect, it } from 'vitest'
import nextConfig from '../../next.config.mjs'

type HeaderRule = { source: string; headers: { key: string; value: string }[] }

async function headerRules(): Promise<HeaderRule[]> {
  const rules = await nextConfig.headers?.()
  if (!rules) throw new Error('next.config headers() missing')
  return rules as HeaderRule[]
}

function headerMap(headers: { key: string; value: string }[]) {
  return Object.fromEntries(headers.map((h) => [h.key, h.value]))
}

describe('next.config headers()', () => {
  it.each(['/invite/:path*', '/welcome/:path*'])(
    'locks down %s (no referrer, noindex, no framing)',
    async (source) => {
      const rules = await headerRules()
      const matches = rules.filter((r) => r.source === source)
      expect(matches).toHaveLength(1)
      expect(headerMap(matches[0].headers)).toEqual({
        'Referrer-Policy': 'no-referrer',
        'X-Robots-Tag': 'noindex, nofollow',
        'Content-Security-Policy': "frame-ancestors 'none'",
      })
    }
  )

  it('keeps the existing marketing workspace entry', async () => {
    const rules = await headerRules()
    const entry = rules.find((r) => r.source === '/marketing/workspace/:path*')
    expect(entry).toBeDefined()
    const map = headerMap(entry!.headers)
    expect(map['Content-Security-Policy']).toMatch(/^frame-ancestors 'self'/)
    expect(map['X-Robots-Tag']).toBe('noindex, nofollow')
    expect(map['Referrer-Policy']).toBeUndefined()
  })
})
