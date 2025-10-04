import { createBrowserClient } from '@supabase/ssr'

// Singleton pattern لتجنب إنشاء clients متعددة
let client = null

// دالة للحصول على الـ URL الصحيح
const getURL = () => {
  let url =
    process.env.NEXT_PUBLIC_SITE_URL ?? // من متغيرات البيئة
    process.env.NEXT_PUBLIC_VERCEL_URL ?? // تلقائياً من Vercel
    'http://localhost:3000';
  
  // تأكد من وجود https:// أو http://
  url = url.includes('http') ? url : `https://${url}`;
  
  // إزالة trailing slash
  url = url.endsWith('/') ? url.slice(0, -1) : url;
  
  return url;
};

export function createClient() {
  if (client) return client

  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        flowType: 'pkce',
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        // تحديد الـ redirect URL الصحيح
        redirectTo: `${getURL()}/auth/callback`
      }
    }
  )

  return client
}

// دالة مساعدة للتحقق من المصادقة
export async function getUser() {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }
  
  return user
}

// دالة مساعدة للتحقق من الجلسة
export async function getSession() {
  const supabase = createClient()
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error || !session) {
    return null
  }
  
  return session
}

// دالة لتسجيل الدخول مع Google
export async function signInWithGoogle(redirectTo = '/main') {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${getURL()}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });
  
  return { data, error };
}

// دالة لإعادة تعيين كلمة المرور
export async function resetPasswordForEmail(email) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${getURL()}/auth/callback?type=recovery`,
  });
  
  return { data, error };
}