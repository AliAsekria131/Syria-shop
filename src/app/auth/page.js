// ============================================
// ملف: auth/page.js
// المسار: src/app/auth/page.js
// ============================================
"use client";

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { createClient } from '../../../lib/supabase';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense, useMemo } from 'react';

const ALLOWED_REDIRECTS = ['/main', '/dashboard', '/favorites', '/add-product', '/settings'];

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [authView, setAuthView] = useState('sign_in');
  
  const supabase = useMemo(() => createClient(), []);

  const safeRedirect = useMemo(() => {
    const redirect = searchParams.get('redirectTo');
    if (!redirect) return '/main';
    
    const isAllowed = ALLOWED_REDIRECTS.some(allowed => 
      redirect === allowed || redirect.startsWith(allowed + '/')
    );
    
    const isRelative = redirect.startsWith('/') && !redirect.startsWith('//');
    
    return (isAllowed && isRelative) ? redirect : '/main';
  }, [searchParams]);

  useEffect(() => {
    let mounted = true;

    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const type = searchParams.get('type');
        
        if (session && mounted) {
          if (type === 'recovery') {
            setAuthView('update_password');
            setLoading(false);
          } else {
            router.replace(safeRedirect);
          }
        } else if (mounted) {
          setLoading(false);
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error checking session:', error);
        }
        if (mounted) setLoading(false);
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;

        if (event === 'SIGNED_IN' && session) {
          const type = searchParams.get('type');
          if (type !== 'recovery') {
            router.replace(safeRedirect);
          }
        }

        if (event === 'PASSWORD_RECOVERY') {
          setAuthView('update_password');
        }

        if (event === 'USER_UPDATED' && authView === 'update_password') {
          setTimeout(() => {
            router.replace('/main');
          }, 1500);
        }

        if (event === 'SIGNED_OUT') {
          setAuthView('sign_in');
          router.replace('/');
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, router, safeRedirect, searchParams, authView]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {authView === 'update_password' ? (
              <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {authView === 'update_password' ? 'تحديث كلمة المرور' : 'مرحباً بك'}
          </h1>
          <p className="text-gray-600">
            {authView === 'update_password' 
              ? 'أدخل كلمة المرور الجديدة الخاصة بك' 
              : 'سجل دخولك أو أنشئ حساب جديد'
            }
          </p>
        </div>

        {searchParams.get('error') && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-700 text-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>حدث خطأ أثناء المصادقة. يرجى المحاولة مرة أخرى.</span>
            </div>
          </div>
        )}

        {authView === 'update_password' && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">نصائح لكلمة مرور قوية:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>استخدم 6 أحرف على الأقل</li>
                  <li>امزج بين الأحرف والأرقام</li>
                  <li>تجنب المعلومات الشخصية</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        <div dir="rtl">
          <Auth
            supabaseClient={supabase}
            view={authView}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#3b82f6',
                    brandAccent: '#2563eb',
                    brandButtonText: 'white',
                    defaultButtonBackground: '#f3f4f6',
                    defaultButtonBackgroundHover: '#e5e7eb',
                  },
                  radii: {
                    borderRadiusButton: '0.5rem',
                    buttonBorderRadius: '0.5rem',
                    inputBorderRadius: '0.5rem',
                  },
                  fontSizes: {
                    baseBodySize: '14px',
                    baseInputSize: '14px',
                    baseLabelSize: '14px',
                    baseButtonSize: '14px',
                  },
                  space: {
                    buttonPadding: '12px 16px',
                    inputPadding: '12px 16px',
                  },
                },
              },
              className: {
                container: 'space-y-4',
                button: 'font-semibold transition-all duration-200 hover:shadow-lg',
                input: 'transition-all duration-200 focus:ring-2 focus:ring-blue-500',
                label: 'font-medium text-gray-700',
                anchor: 'text-blue-500 hover:text-blue-600 font-medium hover:underline',
                message: 'text-center p-3 rounded-lg text-sm',
              },
            }}
            localization={{
              variables: {
                sign_in: {
                  email_label: 'البريد الإلكتروني',
                  password_label: 'كلمة المرور',
                  email_input_placeholder: 'example@email.com',
                  password_input_placeholder: '••••••••',
                  button_label: 'تسجيل الدخول',
                  loading_button_label: 'جاري تسجيل الدخول...',
                  link_text: 'ليس لديك حساب؟ سجل الآن',
                },
                sign_up: {
                  email_label: 'البريد الإلكتروني',
                  password_label: 'كلمة المرور',
                  email_input_placeholder: 'example@email.com',
                  password_input_placeholder: '••••••••',
                  button_label: 'إنشاء حساب',
                  loading_button_label: 'جاري إنشاء الحساب...',
                  link_text: 'لديك حساب؟ سجل دخولك',
                  confirmation_text: 'تحقق من بريدك الإلكتروني للتأكيد',
                },
                forgotten_password: {
                  email_label: 'البريد الإلكتروني',
                  email_input_placeholder: 'example@email.com',
                  button_label: 'إرسال رابط استعادة',
                  loading_button_label: 'جاري الإرسال...',
                  link_text: 'نسيت كلمة المرور؟',
                  confirmation_text: '✓ تم إرسال رابط الاستعادة إلى بريدك',
                },
                update_password: {
                  password_label: 'كلمة المرور الجديدة',
                  password_input_placeholder: '••••••••',
                  button_label: 'تحديث كلمة المرور',
                  loading_button_label: 'جاري التحديث...',
                  confirmation_text: '✓ تم التحديث بنجاح! جاري التوجيه...',
                },
              },
            }}
            providers={[]}
            redirectTo={typeof window !== 'undefined' ? `${window.location.origin}/auth/callback?redirectTo=${safeRedirect}` : undefined}
            showLinks={authView !== 'update_password'}
          />
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-gray-500 hover:text-gray-700 hover:underline transition-colors inline-flex items-center gap-1 text-sm"
          >
            <span>←</span>
            <span>العودة للصفحة الرئيسية</span>
          </Link>
        </div>

        {authView !== 'update_password' && (
          <div className="mt-8 space-y-4">
            <div className="text-center text-xs text-gray-500">
              بتسجيل دخولك، فإنك توافق على شروط الخدمة وسياسة الخصوصية
            </div>

            <div className="text-center">
              <div className="inline-flex items-center gap-2 text-xs text-gray-500 bg-gray-50 px-4 py-2 rounded-full">
                <span>🔒</span>
                <span>تسجيل دخول آمن ومشفر</span>
              </div>
            </div>
          </div>
        )}

        {authView === 'update_password' && (
          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-2 text-xs text-gray-500 bg-gray-50 px-4 py-2 rounded-full">
              <span>🔒</span>
              <span>اتصال آمن ومشفر</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    }>
      <AuthContent />
    </Suspense>
  );
}