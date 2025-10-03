import { createBrowserClient } from '@supabase/ssr'

// Singleton pattern لتجنب إنشاء clients متعددة
let client = null

export function createClient() {
  if (client) return client

  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        // تحديث الجلسة تلقائياً
        autoRefreshToken: true,
        // استمرار الجلسة
        persistSession: true,
        // اكتشاف تغييرات الجلسة
        detectSessionInUrl: true
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