// update-password
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { passwordSchema, updatePasswordSchema } from "@/utils/validation";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  
  // حالات النموذج
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [validSession, setValidSession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // التحقق من وجود جلسة صالحة عند تحميل الصفحة
  // هذا مهم لمنع أي شخص من الدخول مباشرة بدون رابط استعادة صحيح
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setError("الرابط غير صالح أو منتهي الصلاحية");
        setValidSession(false);
      } else {
        setValidSession(true);
      }
      
      setCheckingSession(false);
    };
    
    checkSession();
  }, [supabase]);

  // معالجة إرسال النموذج
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // التحقق من صحة كلمات المرور باستخدام Zod
      updatePasswordSchema.parse({ password, confirmPassword });
      // تحديث كلمة المرور في Supabase
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });
      if (updateError) {
        setError(updateError.message || "حدث خطأ أثناء تحديث كلمة المرور");
        return;
      }
      // نجح التحديث
      setSuccess(true);
    } catch (err) {
      // معالجة أخطاء Zod
      if (err.errors) {
        setError(err.errors[0]?.message || "كلمة المرور غير صالحة");
      } else {
        setError("حدث خطأ غير متوقع. حاول مرة أخرى.");
      }
    } finally {
      setLoading(false);
    }
  };

  // شاشة التحميل أثناء التحقق من الجلسة
  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">جاري التحقق...</p>
        </div>
      </div>
    );
  }

  // شاشة النجاح
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          {/* أيقونة النجاح */}
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            تم تحديث كلمة المرور!
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            تم تحديث كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.
          </p>
          <button
            onClick={() => router.push("/auth")}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            تسجيل الدخول
          </button>
        </div>
      </div>
    );
  }

  // شاشة الرابط غير صالح
  if (!validSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          {/* أيقونة الخطأ */}
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            رابط غير صالح
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {error || "الرابط غير صالح أو منتهي الصلاحية. يرجى طلب رابط جديد."}
          </p>
          <button
            onClick={() => router.push("/auth/reset-password")}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            طلب رابط جديد
          </button>
        </div>
      </div>
    );
  }

  // نموذج تحديث كلمة المرور
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        {/* العنوان */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            تعيين كلمة مرور جديدة
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            أدخل كلمة المرور الجديدة لحسابك
          </p>
        </div>

        {/* رسالة الخطأ */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* النموذج */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* كلمة المرور الجديدة */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              كلمة المرور الجديدة
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="8 أحرف على الأقل (أحرف وأرقام)"
              required
              disabled={loading}
            />
          </div>

          {/* تأكيد كلمة المرور */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              تأكيد كلمة المرور
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="أعد إدخال كلمة المرور"
              required
              disabled={loading}
            />
          </div>

          {/* زر التحديث */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            {loading ? "جاري التحديث..." : "تحديث كلمة المرور"}
          </button>
        </form>
      </div>
    </div>
  );
}