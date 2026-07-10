import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/** Only allow internal relative paths — prevents open redirects */
function safeNextPath(raw: string | null): string {
  if (!raw) return '/dashboard'
  if (!raw.startsWith('/') || raw.startsWith('//')) return '/dashboard'
  if (raw.includes('://')) return '/dashboard'
  return raw
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = safeNextPath(searchParams.get('next'))
  const authError = searchParams.get('error')
  const authErrorCode = searchParams.get('error_code')
  const authErrorDescription = searchParams.get('error_description')

  // Supabase may bounce verify failures straight here with error params
  if (authError || authErrorCode) {
    console.error('[auth/callback] upstream auth error', {
      authError,
      authErrorCode,
      authErrorDescription,
    })
    const params = new URLSearchParams()
    params.set('error', authErrorCode === 'otp_expired' ? 'otp_expired' : 'auth_callback_failed')
    if (authErrorCode) params.set('error_code', authErrorCode)
    return NextResponse.redirect(`${origin}/login?${params.toString()}`)
  }

  if (code) {
    // Build the redirect response first so session cookies are written onto it.
    // Setting cookies only via cookies() and then returning a separate
    // NextResponse.redirect() often drops the session on App Router.
    const successRedirect = NextResponse.redirect(`${origin}${next}`)
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
            cookiesToSet.forEach(({ name, value, options }) => {
              successRedirect.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return successRedirect
    }

    console.error('[auth/callback] exchangeCodeForSession failed', {
      message: error.message,
      status: error.status,
      code: error.code,
    })
  } else {
    console.error('[auth/callback] missing code param')
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
