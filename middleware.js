import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'

// قائمة المسارات التي تتطلب مصادقة
const PROTECTED_PATHS = [
  '/dashboard', '/add-product', '/favorites', '/settings', '/main'
]

// قائمة المسارات الخاصة بتسجيل الدخول
const AUTH_PATHS = ['/auth', '/login', '/signup']

/**
 * دالة مساعدة لإضافة رؤوس الأمان الأساسية
 * @param {NextResponse} response
 */
function addSecurityHeaders(response) {
  const cspHeader = [
    "default-src 'self'",
    // السماح للنصوص البرمجية من Supabase و Next.js فقط
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'", 
    "style-src 'self' 'unsafe-inline'",
    // السماح بالصور من Supabase Storage
    "img-src 'self' data: blob: *.supabase.co",
    "connect-src 'self' *.supabase.co wss://*.supabase.co",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'"
  ].join('; ');

  response.headers.set('Content-Security-Policy', cspHeader.replace(/\s{2,}/g, ' ').trim());
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  
  return response;
}

export async function middleware(request) {
  const res = NextResponse.next();
  
  // إنشاء عميل Supabase مخصص للـ Middleware
  const supabase = createMiddlewareClient({ req: request, res });
  
  // تحديث الجلسة تلقائياً
  const { data: { session } } = await supabase.auth.getSession();

  const { pathname } = request.nextUrl;

  // 1. حماية المسارات المحمية: إذا لم يكن المستخدم مسجلاً، وجهه لصفحة الدخول
  if (PROTECTED_PATHS.some(p => pathname.startsWith(p)) && !session) {
    const redirectUrl = new URL('/auth', request.url);
    redirectUrl.searchParams.set('next', pathname); // استخدام 'next' بدلاً من 'redirectTo' كاصطلاح شائع
    return NextResponse.redirect(redirectUrl);
  }

  // 2. إعادة توجيه المستخدمين المسجلين بعيداً عن صفحات المصادقة
  if (AUTH_PATHS.some(p => pathname.startsWith(p)) && session) {
    const nextPath = request.nextUrl.searchParams.get('next') || '/main';
    return NextResponse.redirect(new URL(nextPath, request.url));
  }
  
  // 3. إعادة توجيه من الصفحة الجذر (/) إلى لوحة التحكم إذا كان مسجلاً
  if (pathname === '/' && session) {
    return NextResponse.redirect(new URL('/main', request.url));
  }

  // إضافة رؤوس الأمان لجميع الاستجابات
  return addSecurityHeaders(res);
}

export const config = {
  matcher: [
    // مطابقة جميع المسارات ما عدا الملفات الثابتة وملفات API الداخلية لـ Next.js
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
