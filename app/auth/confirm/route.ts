import { createServerClient, type CookieOptions } from '@supabase/ssr'
import type { EmailOtpType } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { safeNextPath } from '@/lib/auth/safeNextPath'

const ALLOWED_TYPES = new Set<EmailOtpType>([
  'recovery',
  'invite',
  'email',
  'email_change',
  'magiclink',
])

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const typeRaw = searchParams.get('type')
  const type = typeRaw as EmailOtpType | null

  if (!type || !ALLOWED_TYPES.has(type)) {
    console.error('[auth/confirm] invalid or missing type', { type: typeRaw })
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
  }

  if (!token_hash) {
    console.error('[auth/confirm] missing token_hash')
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
  }

  const fallback =
    type === 'recovery' || type === 'invite' ? '/auth/update-password' : '/dashboard'
  const next = safeNextPath(searchParams.get('next'), fallback)

  // Build the redirect response first so session cookies are written onto it.
  // Same App Router pattern as /auth/callback.
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

  const { error } = await supabase.auth.verifyOtp({ token_hash, type })
  if (!error) {
    return successRedirect
  }

  console.error('[auth/confirm] verifyOtp failed', {
    message: error.message,
    status: error.status,
    code: error.code,
  })

  const loginError = error.code === 'otp_expired' ? 'otp_expired' : 'auth_callback_failed'
  return NextResponse.redirect(`${origin}/login?error=${loginError}`)
}
