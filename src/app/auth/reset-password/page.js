//reset-password
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { emailSchema } from "@/utils/validation";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // التحقق من صحة البريد الإلكتروني باستخدام Zod
      emailSchema.parse(email);

      // إرسال رابط استعادة كلمة المرور
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });

      // معالجة الأخطاء من Supabase
      if (resetError) {
        console.error("Reset password error:", resetError);
        setError(resetError.message || "حدث خطأ أثناء إرسال رابط الاستعادة");
        return;
      }

      // نجح الإرسال
      setSuccess(true);

    } catch (err) {
      console.error("Validation error:", err);
      // معالجة أخطاء Zod
      if (err.errors) {
        setError(err.errors[0]?.message || "البريد الإلكتروني غير صالح");
      } else {
        setError("حدث خطأ غير متوقع. حاول مرة أخرى.");
      }
    } finally {
      setLoading(false);
    }
  };

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
            تم إرسال الرابط!
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني. يرجى التحقق من صندوق الوارد والبريد المزعج.
          </p>
          <button
            onClick={() => router.push("/auth")}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            العودة إلى تسجيل الدخول
          </button>
        </div>
      </div>
    );
  }

  // نموذج إدخال البريد الإلكتروني
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        {/* العنوان */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            استعادة كلمة المرور
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            أدخل بريدك الإلكتروني وسنرسل لك رابط لإعادة تعيين كلمة المرور
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
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              البريد الإلكتروني
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="example@email.com"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            {loading ? "جاري الإرسال..." : "إرسال رابط الاستعادة"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/auth")}
            disabled={loading}
            className="w-full text-gray-600 dark:text-gray-300 py-2 px-4 rounded-lg font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition disabled:opacity-50"
          >
            العودة إلى تسجيل الدخول
          </button>
        </form>
      </div>
    </div>
  );
}