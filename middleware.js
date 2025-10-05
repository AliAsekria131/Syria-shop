import { NextResponse } from 'next/server'
import { createMiddlewareClient } from './lib/supabase'

// الصفحات المحمية (تحتاج تسجيل دخول)
const protectedRoutes = [
  '/dashboard',
  '/favorites',
  '/add-product',
  '/settings',
]

// صفحات المصادقة (يجب عدم الوصول إليها إذا كان المستخدم مسجلاً)
const authRoutes = ['/auth']

// Whitelist للـ redirect URLs المسموحة (حماية من Open Redirect)
const allowedRedirects = [
  '/main',
  '/dashboard',
  '/favorites',
  '/settings',
]

/**
 * التحقق من أن الـ redirect URL آمن
 */
function isAllowedRedirect(redirectPath) {
  // يجب أن يكون مسار داخلي (يبدأ بـ /)
  if (!redirectPath.startsWith('/')) {
    return false
  }
  
  // يجب أن يكون في القائمة المسموحة
  return allowedRedirects.some(allowed => redirectPath.startsWith(allowed))
}

export async function middleware(request) {
  const response = NextResponse.next()
  const supabase = createMiddlewareClient(request, response)

  // تحديث الجلسة
  const { data: { session } } = await supabase.auth.getSession()

  const { pathname } = request.nextUrl

  // إذا كان المستخدم مسجلاً ويحاول الوصول لصفحة المصادقة
  if (session && authRoutes.some(route => pathname.startsWith(route))) {
    // التحقق من redirect parameter
    const redirectParam = request.nextUrl.searchParams.get('redirect')
    if (redirectParam && isAllowedRedirect(redirectParam)) {
      return NextResponse.redirect(new URL(redirectParam, request.url))
    }
    return NextResponse.redirect(new URL('/main', request.url))
  }

  // إذا كان المستخدم غير مسجل ويحاول الوصول لصفحة محمية
  if (!session && protectedRoutes.some(route => pathname.startsWith(route))) {
    const redirectUrl = new URL('/auth', request.url)
    // حفظ الصفحة المطلوبة للعودة إليها بعد تسجيل الدخول
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Security Headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-XSS-Protection', '1; mode=block')

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}