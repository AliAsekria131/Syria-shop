// ============================================
// ملف: auth/callback/route.js
// المسار: src/app/auth/callback/route.js
// ============================================
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const ALLOWED_REDIRECTS = [
  '/main',
  '/dashboard',
  '/favorites',
  '/add-product',
  '/settings',
  '/search'
];

function getSafeRedirectPath(redirectTo) {
  if (!redirectTo || typeof redirectTo !== 'string') {
    return '/main';
  }

  if (!redirectTo.startsWith('/') || redirectTo.startsWith('//')) {
    return '/main';
  }

  const isAllowed = ALLOWED_REDIRECTS.some(allowed => 
    redirectTo === allowed || redirectTo.startsWith(allowed + '/')
  );

  return isAllowed ? redirectTo : '/main';
}

export async function GET(request) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const redirectTo = requestUrl.searchParams.get('redirectTo');
    const type = requestUrl.searchParams.get('type');
    const error_code = requestUrl.searchParams.get('error');
    const error_description = requestUrl.searchParams.get('error_description');

    // معالجة الأخطاء من Supabase
    if (error_code) {
      console.error('OAuth error:', error_code, error_description);
      return NextResponse.redirect(
        new URL(`/auth?error=${encodeURIComponent(error_description || error_code)}`, requestUrl.origin)
      );
    }

    // التحقق من وجود code
    if (!code) {
      return NextResponse.redirect(
        new URL('/auth?error=missing_code', requestUrl.origin)
      );
    }

    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value;
          },
          set(name, value, options) {
            try {
              cookieStore.set({ name, value, ...options });
            } catch (error) {
              // تجاهل أخطاء الـ cookies في middleware
              if (process.env.NODE_ENV === 'development') {
                console.warn('Cookie set error:', error);
              }
            }
          },
          remove(name, options) {
            try {
              cookieStore.delete({ name, ...options });
            } catch (error) {
              // تجاهل أخطاء الـ cookies
              if (process.env.NODE_ENV === 'development') {
                console.warn('Cookie remove error:', error);
              }
            }
          },
        },
      }
    );

    // استبدال الـ code بـ session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Auth callback error:', error);
      return NextResponse.redirect(
        new URL(`/auth?error=${encodeURIComponent(error.message)}`, requestUrl.origin)
      );
    }

    // إنشاء أو تحديث الملف الشخصي
    if (data?.session?.user) {
      const user = data.session.user;
      
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
          avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id',
          ignoreDuplicates: false,
        });

      if (profileError && process.env.NODE_ENV === 'development') {
        console.error('Profile upsert error:', profileError);
      }
    }

    // معالجة إعادة تعيين كلمة المرور
    if (type === 'recovery') {
      return NextResponse.redirect(
        new URL('/auth/reset-password', requestUrl.origin)
      );
    }

    // Redirect إلى الصفحة المطلوبة
    const safePath = getSafeRedirectPath(redirectTo);
    const response = NextResponse.redirect(new URL(safePath, requestUrl.origin));
    
    return response;

  } catch (error) {
    console.error('Unexpected error in auth callback:', error);
    
    return NextResponse.redirect(
      new URL('/auth?error=unexpected_error', new URL(request.url).origin)
    );
  }
}