// proxy.ts — Next.js 16 route guard (formerly middleware.ts)
// Runs at the edge before every matched request.
// Responsibilities:
//   1. Refresh the Supabase session cookie (keeps JWT alive)
//   2. Redirect unauthenticated users away from protected routes
//   3. Redirect authenticated users away from auth pages

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Routes that require an authenticated session
const PROTECTED_PREFIXES = ['/dashboard', '/orders', '/proofs']

// Routes that authenticated users should not see
const AUTH_ROUTES = ['/login', '/signup']

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  // Create a Supabase client wired to the proxy request/response
  // so it can read and refresh the auth cookie transparently.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Write updated cookies back to both the request
          // and the response so the session stays in sync.
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: getUser() must be called here (not getSession())
  // to validate the JWT against Supabase Auth server on every request.
  // getSession() only reads from the cookie and can be spoofed.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // ── Guard: unauthenticated → redirect to /login ───────────
  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  )
  if (isProtected && !user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ── Guard: authenticated → redirect away from auth pages ──
  const isAuthPage = AUTH_ROUTES.some((route) => pathname.startsWith(route))
  if (isAuthPage && user) {
    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.pathname = '/dashboard'
    return NextResponse.redirect(dashboardUrl)
  }

  // ── Redirect root → dashboard or login ───────────────────
  if (pathname === '/') {
    const target = request.nextUrl.clone()
    target.pathname = user ? '/dashboard' : '/login'
    return NextResponse.redirect(target)
  }

  // Return the response with refreshed session cookies
  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static  (static files)
     * - _next/image   (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt
     * - /api routes (handled by Route Handlers, not proxy)
     *
     * Note: per Next.js 16 docs, _next/data routes are
     * always matched even when excluded here.
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|api/).*)',
  ],
}
