import { createBrowserClient } from '@supabase/ssr'
import { createServerClient } from '@supabase/ssr'

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

/**
 * Browser Client (Client Components)
 * استخدم في Client Components فقط
 */
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

/**
 * Server Client (Server Components, Server Actions, Route Handlers)
 * استخدم في Server Components و API Routes
 * 
 * في Next.js 15، يجب استدعاء cookies() داخل الدالة مباشرة
 */
export async function createServerSupabaseClient(cookieStore) {
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Handle errors in Server Components
        }
      },
    },
  })
}

/**
 * Middleware Client
 * استخدم في middleware.js فقط
 */
export function createMiddlewareClient(request, response) {
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value)
          response.cookies.set(name, value, options)
        })
      },
    },
  })
}