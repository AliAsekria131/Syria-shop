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
            } catch {
              // تجاهل أخطاء الـ cookies
            }
          },
          remove(name, options) {
            try {
              cookieStore.delete({ name, ...options });
            } catch {
              // تجاهل أخطاء الـ cookies
            }
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Auth callback error:', error);
      }
      return NextResponse.redirect(
        new URL('/auth?error=auth_failed', requestUrl.origin)
      );
    }

    if (type === 'recovery') {
      return NextResponse.redirect(
        new URL('/auth?type=recovery', requestUrl.origin)
      );
    }

    const safePath = getSafeRedirectPath(redirectTo);
    return NextResponse.redirect(new URL(safePath, requestUrl.origin));

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Unexpected error in auth callback:', error);
    }
    
    return NextResponse.redirect(
      new URL('/auth?error=unexpected', new URL(request.url).origin)
    );
  }
}