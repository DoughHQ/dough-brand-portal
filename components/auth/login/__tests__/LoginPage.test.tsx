import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

const seeded: unknown[] = []
let budget = 0
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>()
  return {
    ...actual,
    useState: (init: unknown) => {
      if (budget > 0) {
        budget--
        return [seeded.shift(), () => {}]
      }
      return actual.useState(init)
    },
  }
})
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: () => {}, replace: () => {} }) }))
vi.mock('@/lib/supabase', () => ({ createClient: () => ({ auth: {} }) }))

import LoginPage from '@/app/login/page'

function render(state: unknown[]) {
  seeded.length = 0
  seeded.push(...state)
  budget = 7
  const html = renderToStaticMarkup(<LoginPage />)
  budget = 0
  return html
}

function inOrder(html: string, parts: string[]) {
  let cursor = 0
  for (const part of parts) {
    const at = html.indexOf(part, cursor)
    expect(at, part).toBeGreaterThanOrEqual(0)
    cursor = at + part.length
  }
}

describe('LoginPage', () => {
  it('renders the sign-in step', () => {
    const html = render(['login', false, 'Bad credentials', null, '', '', ''])
    inOrder(html, [
      'Sign in',
      'For approved brand partners only.',
      'Email',
      'Password',
      'Bad credentials',
      'Forgot password?',
      'href="/apply"',
      'Request access',
    ])
    expect(html).not.toContain('Reset password')
  })

  it('renders the reset step with info and loading copy', () => {
    const html = render(['forgot', true, null, 'Check your inbox', '', '', 'a@b.com'])
    inOrder(html, ['Reset password', 'Email', 'Check your inbox', 'Sending...', 'Back to sign in'])
    expect(html).not.toContain('Forgot password?')
  })
})
