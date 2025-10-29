import { createServerClient } from '@supabase/ssr'
import { supabase } from '../../lib/supabase';
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // قائمة الصفحات المحمية (تحتاج تسجيل دخول)
  const protectedPaths = [
    '/dashboard',
    '/add-product',
    '/favorites',
    '/settings',
    '/main'
  ]

  // قائمة الصفحات العامة (للزوار فقط)
  const publicOnlyPaths = ['/auth', '/login', '/signup']

  const pathname = request.nextUrl.pathname

  // التحقق من الصفحات المحمية
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path))
  const isPublicOnlyPath = publicOnlyPaths.some(path => pathname.startsWith(path))

  // إعادة توجيه المستخدمين غير المسجلين من الصفحات المحمية
  if (isProtectedPath && !user) {
    const redirectUrl = new URL('/auth', request.url)
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // إعادة توجيه المستخدمين المسجلين من صفحات المصادقة
  if (isPublicOnlyPath && user) {
    // التحقق من وجود redirectTo في query params
    const redirectTo = request.nextUrl.searchParams.get('redirectTo')
    const redirectUrl = new URL(redirectTo || '/main', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * مطابقة جميع المسارات ماعدا:
     * - _next/static (ملفات static)
     * - _next/image (ملفات تحسين الصور)
     * - favicon.ico (ملف الأيقونة)
     * - الملفات العامة (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}