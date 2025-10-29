import { cookies } from 'next/headers'
import { createServerSupabaseClient } from '@/supabase/client'

/**
 * الحصول على الجلسة من Server Component
 * استخدم هذه الدالة في Server Components فقط
 */
export async function getServerSession() {
  try {
    const cookieStore = await cookies()
    const supabase = await createServerSupabaseClient(cookieStore)
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) return null
    return session
  } catch {
    return null
  }
}

/**
 * الحصول على المستخدم من Server Component
 * استخدم هذه الدالة في Server Components فقط
 */
export async function getServerUser() {
  try {
    const cookieStore = await cookies()
    const supabase = await createServerSupabaseClient(cookieStore)
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) return null
    return user
  } catch {
    return null
  }
}

/**
 * الحصول على Profile المستخدم من Server Component
 */
export async function getServerProfile() {
  try {
    const user = await getServerUser()
    if (!user) return null

    const cookieStore = await cookies()
    const supabase = await createServerSupabaseClient(cookieStore)
    
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (error) return null
    return profile
  } catch {
    return null
  }
}