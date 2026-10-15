import { readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
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
    const applyDir = resolve(__dirname, '../../components/auth/apply')
    const src = [
      resolve(__dirname, '../../components/auth/ApplyBrandFlow.tsx'),
      ...readdirSync(applyDir)
        .filter((name) => /\.(ts|tsx)$/.test(name))
        .map((name) => join(applyDir, name)),
    ]
      .map((file) => readFileSync(file, 'utf8'))
      .join('\n')
    expect(src).toMatch(/APPLY_WHILE_AUTH_COPY/)
    expect(src).toMatch(/applyWaitlistInsertErrorCopy/)
    expect(src).toMatch(/getSession/)
    expect(src).toMatch(/signOut\(\{ scope: 'local' \}\)/)
  })
})
