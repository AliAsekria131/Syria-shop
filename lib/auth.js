import { createClient } from "./supabase";

/**
 * تسجيل حساب جديد
 */
export async function signUp(email, password, metadata = {}) {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
      data: metadata, // بيانات إضافية (full_name, phone, etc.)
    },
  });

  if (error) throw error;
  return data;
}

/**
 * تسجيل الدخول
 */
export async function signIn(email, password) {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

/**
 * تسجيل الخروج
 */
export async function signOut() {
  const supabase = createClient();

  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * إرسال رابط استعادة كلمة المرور
 */
export async function resetPassword(email) {
  const supabase = createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/update-password`,
  });

  if (error) throw error;
}

/**
 * تحديث كلمة المرور (بعد النقر على رابط Reset)
 */
export async function updatePassword(newPassword) {
  const supabase = createClient();

  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) throw error;

  return data;
}

/**
 * الحصول على الجلسة الحالية (Client)
 */
export async function getSession() {
  const supabase = createClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) throw error;
  return session;
}

/**
 * الحصول على المستخدم الحالي (Client)
 */
export async function getUser() {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;
  return user;
}
