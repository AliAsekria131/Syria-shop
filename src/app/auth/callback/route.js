import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerSupabaseClient } from '../../../../lib/supabase'

/**
 * معالجة Callback من Supabase Auth
 * يتم استدعاء هذا الـ Route عند:
 * 1. تأكيد البريد الإلكتروني (Email Verification)
 * 2. النقر على رابط استعادة كلمة المرور (Password Reset)
 */
export async function GET(request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const error_description = requestUrl.searchParams.get('error_description')

  // إذا كان هناك خطأ من Supabase
  if (error) {
    console.error('Auth callback error:', error, error_description)
    return NextResponse.redirect(
      new URL(`/auth?error=${encodeURIComponent(error_description || error)}`, requestUrl.origin)
    )
  }

  // إذا لم يكن هناك code، إعادة توجيه إلى صفحة المصادقة
  if (!code) {
    return NextResponse.redirect(new URL('/auth', requestUrl.origin))
  }

  try {
    const cookieStore = await cookies()
    const supabase = await createServerSupabaseClient(cookieStore)

    // تبادل الـ code بـ session
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('Code exchange error:', exchangeError)
      return NextResponse.redirect(
        new URL('/auth?error=رابط غير صالح أو منتهي الصلاحية', requestUrl.origin)
      )
    }

    // التحقق من نوع الحدث
    const { user } = data

    if (!user) {
      return NextResponse.redirect(new URL('/auth', requestUrl.origin))
    }

    // إذا كان المستخدم جديداً (Email Verification)
    // إنشاء Profile في قاعدة البيانات
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    // إذا لم يكن الـ Profile موجوداً، إنشاؤه
    if (profileError || !profile) {
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || '',
          avatar_url: user.user_metadata?.avatar_url || null,
        })

      if (insertError) {
        console.error('Profile creation error:', insertError)
        // المتابعة حتى لو فشل إنشاء الـ Profile
        // يمكن إنشاؤه لاحقاً عبر Database Trigger
      }
    }

    // إعادة توجيه إلى الصفحة الرئيسية
    return NextResponse.redirect(new URL('/main', requestUrl.origin))

  } catch (err) {
    console.error('Unexpected callback error:', err)
    return NextResponse.redirect(
      new URL('/auth?error=حدث خطأ غير متوقع', requestUrl.origin)
    )
  }
}