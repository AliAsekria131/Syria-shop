"use client";

import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";

export default function ForgotPassword() {
  const supabase = createClientComponentClient();
  
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleResetRequest = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError("البريد الإلكتروني مطلوب");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("البريد الإلكتروني غير صحيح");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        }
      );

      if (resetError) {
        if (resetError.message.includes("User not found")) {
          setError("لم يتم العثور على حساب بهذا البريد الإلكتروني");
        } else if (resetError.message.includes("Email rate limit exceeded")) {
          setError("تم إرسال الكثير من الطلبات. يرجى المحاولة لاحقاً");
        } else {
          setError("حدث خطأ في إرسال رابط إعادة التعيين");
        }
        return;
      }

      setSent(true);
    } catch (err) {
      console.error("Password reset error:", err);
      setError("حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  const resendResetEmail = async () => {
    try {
      setLoading(true);
      setError("");

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        }
      );

      if (resetError) {
        setError("فشل في إعادة الإرسال. يرجى المحاولة لاحقاً");
      } else {
        alert("تم إعادة إرسال الرسالة بنجاح!");
      }
    } catch (err) {
      setError("حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
          {/* أيقونة البريد */}
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-4xl">📧</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              تم إرسال رابط إعادة التعيين
            </h1>
          </div>

          {/* رسالة التأكيد */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <p className="text-gray-700 mb-4">
              تم إرسال رابط إعادة تعيين كلمة المرور إلى:
            </p>
            <p className="font-bold text-blue-600 text-lg mb-4">
              {email}
            </p>
            <div className="text-sm text-gray-600 space-y-2">
              <p>📌 اتبع الخطوات التالية:</p>
              <div className="text-right space-y-1">
                <p>1️⃣ افتح بريدك الإلكتروني</p>
                <p>2️⃣ ابحث عن رسالة من موقعنا</p>
                <p>3️⃣ اضغط على "إعادة تعيين كلمة المرور"</p>
                <p>4️⃣ أدخل كلمة المرور الجديدة</p>
              </div>
            </div>
          </div>

          {/* أزرار الإجراءات */}
          <div className="space-y-3">
            <button
              onClick={resendResetEmail}
              disabled={loading}
              className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400"
            >
              {loading ? "جاري الإرسال..." : "إعادة إرسال الرسالة"}
            </button>

            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                لم تجد الرسالة؟ تحقق من مجلد البريد المزعج
              </p>
              
              <Link
                href="/login"
                className="text-blue-500 hover:text-blue-600 text-sm hover:underline block"
              >
                العودة لتسجيل الدخول
              </Link>
              
              <Link
                href="/"
                className="text-gray-500 hover:text-gray-700 text-sm hover:underline block"
              >
                العودة للصفحة الرئيسية
              </Link>
            </div>
          </div>

          {/* تنبيه هام */}
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-sm font-semibold mb-1">
              ⚠️ تنبيه هام
            </p>
            <p className="text-yellow-700 text-xs">
              رابط إعادة التعيين صالح لمدة محدودة فقط. إذا انتهت صلاحيته، يمكنك طلب رابط جديد.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        {/* رأس الصفحة */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <div className="text-4xl">🛍️</div>
          </Link>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            نسيت كلمة المرور؟
          </h1>
          <p className="text-gray-600">
            أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين
          </p>
        </div>

        {/* عرض الأخطاء */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600 text-sm flex items-center gap-2">
              <span>❌</span>
              {error}
            </p>
          </div>
        )}

        {/* نموذج إعادة تعيين كلمة المرور */}
        <form onSubmit={handleResetRequest} className="space-y-6">
          {/* البريد الإلكتروني */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              البريد الإلكتروني *
            </label>
            <input
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError("");
              }}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
              disabled={loading}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              سنرسل رابط إعادة التعيين إلى هذا العنوان
            </p>
          </div>

          {/* زر الإرسال */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg text-white font-bold transition-all ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-purple-500 hover:bg-purple-600 hover:shadow-lg transform hover:-translate-y-0.5"
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                جاري الإرسال...
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <span>📧</span>
                إرسال رابط إعادة التعيين
              </div>
            )}
          </button>
        </form>

        {/* روابط إضافية */}
        <div className="mt-8 text-center space-y-4">
          <div className="text-gray-600">
            تذكرت كلمة المرور؟{" "}
            <Link
              href="/login"
              className="text-purple-500 hover:text-purple-600 font-semibold hover:underline transition-colors"
            >
              تسجيل الدخول
            </Link>
          </div>

          <div className="text-gray-600">
            ليس لديك حساب؟{" "}
            <Link
              href="/signup"
              className="text-green-500 hover:text-green-600 font-semibold hover:underline transition-colors"
            >
              إنشاء حساب جديد
            </Link>
          </div>

          <div className="text-gray-600">
            <Link
              href="/"
              className="text-gray-500 hover:text-gray-700 hover:underline transition-colors inline-flex items-center gap-1"
            >
              <span>←</span>
              العودة للصفحة الرئيسية
            </Link>
          </div>
        </div>

        {/* معلومات إضافية */}
        <div className="mt-8 text-center text-xs text-gray-500">
          إعادة تعيين كلمة المرور آمنة ومشفرة
        </div>

        {/* معلومات الأمان */}
        <div className="mt-4 text-center">
          <div className="inline-flex items-center gap-2 text-xs text-gray-500">
            <span>🔒</span>
            <span>عملية آمنة ومشفرة</span>
          </div>
        </div>
      </div>
    </div>
  );
}