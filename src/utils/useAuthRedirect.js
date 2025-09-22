// src/utils/useAuthRedirect.js
// Hook للتوجيه التلقائي حسب حالة المصادقة

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

/**
 * Hook للتوجيه التلقائي للمستخدمين المسجلين
 * @param {string} redirectTo - الصفحة المراد التوجيه إليها (افتراضي: /main)
 * @returns {Object} - معلومات المستخدم وحالة التحميل
 */
export const useAuthRedirect = (redirectTo = '/main') => {
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        // إذا كان المستخدم مسجل دخول، وجهه للصفحة المحددة
        if (user && !error) {
          router.push(redirectTo);
        }
      } catch (error) {
        console.error("Error checking auth:", error);
      }
    };

    checkAuthAndRedirect();

    // مراقبة تغييرات المصادقة
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          router.push(redirectTo);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase, router, redirectTo]);
};

/**
 * Hook للتحقق من المصادقة مع إعادة توجيه للصفحة الرئيسية إذا لم يكن مسجل
 * @returns {Object} - معلومات المستخدم وحالة التحميل
 */
export const useRequireAuth = () => {
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        // إذا لم يكن مسجل دخول، وجهه للصفحة الرئيسية
        if (!user || error) {
          router.push('/');
        }
      } catch (error) {
        console.error("Error checking auth:", error);
        router.push('/');
      }
    };

    checkAuth();

    // مراقبة تغييرات المصادقة
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT' || !session?.user) {
          router.push('/');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase, router]);
};