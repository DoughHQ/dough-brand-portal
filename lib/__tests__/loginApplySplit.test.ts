import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('/login apply split', () => {
  it('does not import ApplyBrandFlow', () => {
    const src = readFileSync(
      resolve(__dirname, '../../app/login/page.tsx'),
      'utf8'
    )
    expect(src).not.toMatch(/ApplyBrandFlow/)
    expect(src).toMatch(/href=["']\/apply["']/)
    expect(src).toMatch(/type Step = 'login' \| 'forgot'/)
  })

  it('hosts ApplyBrandFlow on /apply', () => {
    const src = readFileSync(
      resolve(__dirname, '../../app/apply/page.tsx'),
      'utf8'
    )
    expect(src).toMatch(/ApplyBrandFlow/)
    expect(src).toMatch(/Request access/)
    expect(src).toMatch(/router\.push\(['"]\/login['"]\)/)
  })

  it('ApplyBrandFlow detects a session and maps 42501', () => {
    const src = readFileSync(
      resolve(__dirname, '../../components/auth/ApplyBrandFlow.tsx'),
      'utf8'
    )
    expect(src).toMatch(/APPLY_WHILE_AUTH_COPY/)
    expect(src).toMatch(/applyWaitlistInsertErrorCopy/)
    expect(src).toMatch(/getSession/)
    expect(src).toMatch(/signOut\(\{ scope: 'local' \}\)/)
  })
})
