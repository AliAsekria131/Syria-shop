"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";

export default function Login() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  // الحالات
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(true); // حالة جديدة للتحقق من المصادقة

  // التحقق من المصادقة عند تحميل الصفحة
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        router.replace("/main"); // استخدم replace لتجنب الرجوع لصفحة الدخول
      } else {
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, [supabase, router]);

  // دالة التحقق من صحة البيانات
  const validateForm = () => {
    const newErrors = [];
    const { email, password } = formData;

    // التحقق من البريد الإلكتروني
    if (!email) {
      newErrors.push("البريد الإلكتروني مطلوب");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.push("البريد الإلكتروني غير صحيح");
    }

    // التحقق من كلمة المرور
    if (!password) {
      newErrors.push("كلمة المرور مطلوبة");
    } else if (password.length < 6) {
      newErrors.push("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
    }

    return newErrors;
  };

  // دالة تحديث الحقول
  const updateField = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // إزالة الأخطاء عند الكتابة
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  // دالة تسجيل الدخول
  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setErrors([]);

      // التحقق من صحة البيانات
      const validationErrors = validateForm();
      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        return;
      }

      // محاولة تسجيل الدخول
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      if (error) {
        // معالجة أخطاء تسجيل الدخول
        let errorMessage = "حدث خطأ في تسجيل الدخول";

        if (error.message.includes("Invalid login credentials")) {
          errorMessage = "البريد الإلكتروني أو كلمة المرور غير صحيحة";
        } else if (error.message.includes("Email not confirmed")) {
          errorMessage = "يرجى تأكيد بريدك الإلكتروني أولاً";
        } else if (error.message.includes("Too many requests")) {
          errorMessage = "محاولات كثيرة، يرجى المحاولة لاحقاً";
        } else if (error.message.includes("Email address not confirmed")) {
          errorMessage =
            "يرجى تأكيد حسابك من خلال الرسالة المرسلة إلى بريدك الإلكتروني";
        }

        setErrors([errorMessage]);
        return;
      }

      // التوجه إلى الصفحة الرئيسية
      router.push("/main");
    } catch (err) {
      console.error("Login error:", err);
      setErrors(["حدث خطأ غير متوقع"]);
    } finally {
      setLoading(false);
    }
  };

  // عرض شاشة تحميل أثناء التحقق من المصادقة
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحقق من الجلسة...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        {/* رأس الصفحة */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <div className="text-4xl">🛍️</div>
          </Link>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            مرحباً بك مجدداً
          </h1>
          <p className="text-gray-600">سجل دخولك للوصول إلى حسابك</p>
        </div>

        {/* عرض الأخطاء */}
        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            {errors.map((error, index) => (
              <p
                key={index}
                className="text-red-600 text-sm flex items-center gap-2"
              >
                <span>❌</span>
                {error}
              </p>
            ))}
          </div>
        )}

        {/* نموذج تسجيل الدخول */}
        <form onSubmit={handleLogin} className="space-y-6">
          {/* البريد الإلكتروني */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              البريد الإلكتروني *
            </label>
            <input
              type="email"
              placeholder="example@email.com"
              value={formData.email}
              onChange={(e) => updateField("email", e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
              disabled={loading}
              required
            />
          </div>

          {/* كلمة المرور */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              كلمة المرور *
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => updateField("password", e.target.value)}
                className="w-full p-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                disabled={loading}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                disabled={loading}
                tabIndex="-1"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {/* رابط نسيت كلمة المرور */}
          <div className="text-right">
            <Link
              href="/auth/forgot-password"
              className="text-blue-500 hover:text-blue-600 text-sm font-medium hover:underline transition-colors"
            >
              نسيت كلمة المرور؟
            </Link>
          </div>

          {/* زر تسجيل الدخول */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg text-white font-bold transition-all ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600 hover:shadow-lg transform hover:-translate-y-0.5"
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                جاري تسجيل الدخول...
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <span>🔐</span>
                تسجيل الدخول
              </div>
            )}
          </button>
        </form>

        {/* روابط إضافية */}
        <div className="mt-8 text-center space-y-4">
          <div className="text-gray-600">
            ليس لديك حساب؟{" "}
            <Link
              href="/signup"
              className="text-blue-500 hover:text-blue-600 font-semibold hover:underline transition-colors"
            >
              أنشئ حساب جديد
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
          بتسجيل دخولك، فإنك توافق على شروط الخدمة وسياسة الخصوصية
        </div>

        {/* معلومات الأمان */}
        <div className="mt-4 text-center">
          <div className="inline-flex items-center gap-2 text-xs text-gray-500">
            <span>🔒</span>
            <span>تسجيل دخول آمن ومشفر</span>
          </div>
        </div>
      </div>
    </div>
  );
}
