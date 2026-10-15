import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { sessionIdFromAccessToken } from '@/lib/auth/sessionId'
import { logHandledRpcFailure } from '@/lib/portal/logHandledRpcFailure'

export const SIGNIN_SID_COOKIE = 'runoff_signin_sid'

const SIGNIN_SID_MAX_AGE = 60 * 60 * 24 * 30

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — required for SSR auth cookie sync
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  if (user && !path.startsWith('/auth/callback')) {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const sid = sessionIdFromAccessToken(session?.access_token)
    const prior = request.cookies.get(SIGNIN_SID_COOKIE)?.value ?? null

    if (sid && sid !== prior) {
      const { error } = await supabase.rpc('record_brand_portal_login')
      if (error) {
        logHandledRpcFailure('record_brand_portal_login', {
          code: error.code ?? null,
          message: null,
          details: null,
          hint: null,
        })
      } else {
        // Set on the final response after setAll may have replaced it.
        supabaseResponse.cookies.set(SIGNIN_SID_COOKIE, sid, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: SIGNIN_SID_MAX_AGE,
        })
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
