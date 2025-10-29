"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { loginSchema, signupSchema } from "@/utils/validation";

export default function AuthContent() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/main";

  // ═══════════════════════════════════════════
  // 📦 STATES
  // ═══════════════════════════════════════════
  const [mode, setMode] = useState("login"); // login أو signup
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // رسائل النجاح والخطأ
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // حقول الإدخال
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");

  // ═══════════════════════════════════════════
  // 🔐 التحقق من الجلسة عند التحميل
  // ═══════════════════════════════════════════
useEffect(() => {
  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      router.push(redirectTo);
    } else {
      setCheckingAuth(false);
    }
  };
  checkUser();
}, [supabase, router, redirectTo]);
  // ═══════════════════════════════════════════
  // 📝 تسجيل الدخول
  // ═══════════════════════════════════════════
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // التحقق من صحة البيانات بـ Zod
      loginSchema.parse({ email, password });
      // تسجيل الدخول
      const { error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });
      if (error) throw error;
      // النجاح → التوجيه
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      // عرض رسالة الخطأ
      setError(
        err.errors
          ? err.errors[0].message // خطأ من Zod
          : "البريد الإلكتروني أو كلمة المرور غير صحيحة", // خطأ من Supabase
      );
    } finally {
      setLoading(false);
    }
  };
  // ═══════════════════════════════════════════
  // ✍️ إنشاء حساب جديد
  // ═══════════════════════════════════════════
  const handleSignUp = async (e) => {
  e.preventDefault();
  setError("");
  setLoading(true);

  try {
    // التحقق من البيانات
    signupSchema.parse({ fullName, email, password, confirmPassword });

    // إنشاء الحساب
    const { data, error: signupError } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    // ✅ معالجة الأخطاء البسيطة
    if (signupError) {
      setError(signupError.message || "حدث خطأ أثناء التسجيل");
      return;
    }
    // ✅ نجح التسجيل - عرض رسالة نجاح
    setSuccess("✅ تم إرسال رابط التفعيل إلى بريدك الإلكتروني");

  } catch (err) {
    // معالجة أخطاء Zod
    if (err.errors) {
      setError(err.errors[0]?.message || "البيانات غير صحيحة");
    } else {
      setError("حدث خطأ غير متوقع");
    }
  } finally {
    setLoading(false);
  }
};
  // ═══════════════════════════════════════════
  // 🔄 التبديل بين Login و Signup
  // ═══════════════════════════════════════════
  const switchMode = (newMode) => {
    setMode(newMode);
    setError("");
    setSuccess("");
  };
  // ═══════════════════════════════════════════
  // ⏳ شاشة التحميل الأولية
  // ═══════════════════════════════════════════
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">جاري التحقق...</p>
        </div>
      </div>
    );
  }
  // ═══════════════════════════════════════════
  // 🎨 واجهة المستخدم
  // ═══════════════════════════════════════════
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {/* العنوان */}
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">
          {mode === "login" ? "تسجيل الدخول" : "إنشاء حساب جديد"}
        </h1>

        {/* أزرار التبديل */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => switchMode("login")}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
              mode === "login"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            تسجيل الدخول
          </button>
          <button
            onClick={() => switchMode("signup")}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
              mode === "signup"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            إنشاء حساب
          </button>
        </div>

        {/* رسائل الخطأ والنجاح */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            {success}
          </div>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* نموذج تسجيل الدخول */}
        {/* ═══════════════════════════════════════════ */}
        {mode === "login" ? (
          <form onSubmit={handleLogin} className="space-y-4">
            {/* البريد الإلكتروني */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                البريد الإلكتروني
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="example@email.com"
                required
                disabled={loading}
              />
            </div>

            {/* كلمة المرور */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* نسيت كلمة المرور */}
            <div className="text-right">
              <button
                type="button"
                onClick={() => router.push("/auth/reset-password")}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                نسيت كلمة المرور؟
              </button>
            </div>

            {/* زر الإرسال */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 transition"
            >
              {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
            </button>
          </form>
        ) : (
          /* ═══════════════════════════════════════════ */
          /* نموذج إنشاء حساب */
          /* ═══════════════════════════════════════════ */
          <form onSubmit={handleSignUp} className="space-y-4">
            {/* الاسم الكامل */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الاسم الكامل
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="أدخل اسمك الكامل"
                required
                disabled={loading}
              />
            </div>

            {/* البريد الإلكتروني */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                البريد الإلكتروني
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="example@email.com"
                required
                disabled={loading}
              />
            </div>

            {/* كلمة المرور */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="8 أحرف على الأقل"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* تأكيد كلمة المرور */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                تأكيد كلمة المرور
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="أعد إدخال كلمة المرور"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* زر الإرسال */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 transition"
            >
              {loading ? "جاري إنشاء الحساب..." : "إنشاء حساب"}
            </button>

            {/* العودة للصفحة الرئيسية */}
            <button
              type="button"
              onClick={() => router.push("/")}
              className="w-full text-sm text-blue-600 hover:text-blue-700"
            >
              العودة للصفحة الرئيسية
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
