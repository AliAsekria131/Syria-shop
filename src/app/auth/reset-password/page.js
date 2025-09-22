"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ResetPassword() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [sessionChecking, setSessionChecking] = useState(true);
  const [resetSuccess, setResetSuccess] = useState(false);

  // التحقق من صحة الجلسة عند تحميل الصفحة
  useEffect(() => {
    const checkSession = async () => {
      try {
        // التحقق من الجلسة الحالية
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Session error:", error);
          setIsValidSession(false);
        } else if (session && session.user) {
          console.log("Valid session found:", session.user.email);
          setIsValidSession(true);
        } else {
          console.log("No valid session found");
          setIsValidSession(false);
        }
      } catch (err) {
        console.error("Session check error:", err);
        setIsValidSession(false);
      } finally {
        setSessionChecking(false);
      }
    };

    checkSession();
  }, [supabase]);

  // دالة قياس قوة كلمة المرور
  const getPasswordStrength = (password) => {
    if (!password) return { level: 0, text: "", color: "gray" };

    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score < 2) return { level: 1, text: "ضعيفة", color: "red" };
    if (score < 4) return { level: 2, text: "متوسطة", color: "yellow" };
    return { level: 3, text: "قوية", color: "green" };
  };

  // دالة التحقق من صحة البيانات
  const validateForm = () => {
    const newErrors = [];
    const { password, confirmPassword } = formData;

    if (!password) {
      newErrors.push("كلمة المرور مطلوبة");
    } else {
      if (password.length < 6) {
        newErrors.push("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      }
      if (password.length > 72) { // Supabase limit
        newErrors.push("كلمة المرور طويلة جداً (أقصى حد 72 حرف)");
      }
    }

    if (!confirmPassword) {
      newErrors.push("تأكيد كلمة المرور مطلوب");
    } else if (password !== confirmPassword) {
      newErrors.push("كلمتا المرور غير متطابقتين");
    }

    return newErrors;
  };

  // دالة تحديث الحقول
  const updateField = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors.length > 0) {
      setErrors([]);
    }
  };

  // دالة إعادة تعيين كلمة المرور
  const handleResetPassword = async (e) => {
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

      console.log("Attempting to update password...");

      // إعادة تعيين كلمة المرور
      const { data, error } = await supabase.auth.updateUser({
        password: formData.password
      });

      if (error) {
        console.error("Password update error:", error);
        let errorMessage = "حدث خطأ في إعادة تعيين كلمة المرور";

        if (error.message.includes("Password should be at least 6 characters")) {
          errorMessage = "كلمة المرور يجب أن تكون 6 أحرف على الأقل";
        } else if (error.message.includes("New password should be different")) {
          errorMessage = "كلمة المرور الجديدة يجب أن تكون مختلفة عن السابقة";
        } else if (error.message.includes("Auth session missing")) {
          errorMessage = "انتهت صلاحية الرابط. يرجى طلب رابط جديد";
        }

        setErrors([errorMessage]);
        return;
      }

      console.log("Password updated successfully:", data);

      // نجح إعادة تعيين كلمة المرور
      setResetSuccess(true);

      // انتظار قصير ثم إعادة التوجيه
      setTimeout(() => {
        router.push("/login?message=password_updated");
      }, 3000);

    } catch (err) {
      console.error("Reset password error:", err);
      setErrors(["حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى"]);
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = getPasswordStrength(formData.password);

  // عرض شاشة التحميل أثناء التحقق من الجلسة
  if (sessionChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6">
            <div className="w-full h-full border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            جاري التحقق...
          </h1>
          <p className="text-gray-600">
            يرجى الانتظار بينما نتحقق من صحة الرابط
          </p>
        </div>
      </div>
    );
  }

  // إذا تم إعادة تعيين كلمة المرور بنجاح
  if (resetSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
            <span className="text-3xl">✅</span>
          </div>
          <h1 className="text-2xl font-bold text-green-800 mb-4">
            تم بنجاح!
          </h1>
          <p className="text-green-700 mb-6">
            تم إعادة تعيين كلمة المرور بنجاح. جاري إعادة التوجيه لصفحة تسجيل الدخول...
          </p>
          <div className="text-sm text-gray-600">
            إذا لم يتم إعادة التوجيه تلقائياً،{" "}
            <Link href="/login" className="text-blue-500 hover:underline font-medium">
              انقر هنا للمتابعة
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // إذا كانت الجلسة غير صالحة
  if (!isValidSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-3xl">⚠️</span>
          </div>
          <h1 className="text-2xl font-bold text-red-800 mb-4">
            رابط غير صالح أو منتهي الصلاحية
          </h1>
          <p className="text-red-700 mb-6">
            الرابط الذي استخدمته غير صالح أو انتهت صلاحيته. يرجى طلب رابط جديد.
          </p>
          <div className="space-y-3">
            <Link
              href="/auth/forgot-password"
              className="block w-full bg-purple-500 text-white py-3 rounded-lg hover:bg-purple-600 transition-colors font-medium"
            >
              طلب رابط جديد
            </Link>
            <Link
              href="/login"
              className="block w-full bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600 transition-colors font-medium"
            >
              تسجيل الدخول
            </Link>
            <Link
              href="/"
              className="block text-gray-500 hover:text-gray-700 hover:underline text-sm"
            >
              العودة للصفحة الرئيسية
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // نموذج إعادة تعيين كلمة المرور
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        {/* رأس الصفحة */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <div className="text-4xl">🛍️</div>
          </Link>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            إعادة تعيين كلمة المرور
          </h1>
          <p className="text-gray-600">أدخل كلمة المرور الجديدة لحسابك</p>
        </div>

        {/* عرض الأخطاء */}
        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            {errors.map((error, index) => (
              <p
                key={index}
                className="text-red-600 text-sm flex items-center gap-2 mb-1 last:mb-0"
              >
                <span>❌</span>
                {error}
              </p>
            ))}
          </div>
        )}

        {/* نموذج إعادة تعيين كلمة المرور */}
        <form onSubmit={handleResetPassword} className="space-y-6">
          {/* كلمة المرور الجديدة */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              كلمة المرور الجديدة *
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => updateField("password", e.target.value)}
                className="w-full p-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all"
                disabled={loading}
                autoComplete="new-password"
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

            {/* مؤشر قوة كلمة المرور */}
            {formData.password && (
              <div className="mt-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        passwordStrength.color === "red"
                          ? "bg-red-500"
                          : passwordStrength.color === "yellow"
                          ? "bg-yellow-500"
                          : passwordStrength.color === "green"
                          ? "bg-green-500"
                          : "bg-gray-300"
                      }`}
                      style={{
                        width: `${(passwordStrength.level / 3) * 100}%`,
                      }}
                    ></div>
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      passwordStrength.color === "red"
                        ? "text-red-600"
                        : passwordStrength.color === "yellow"
                        ? "text-yellow-600"
                        : passwordStrength.color === "green"
                        ? "text-green-600"
                        : "text-gray-600"
                    }`}
                  >
                    {passwordStrength.text}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  استخدم 6 أحرف على الأقل مع مزيج من الأحرف والأرقام
                </p>
              </div>
            )}
          </div>

          {/* تأكيد كلمة المرور */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              تأكيد كلمة المرور الجديدة *
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => updateField("confirmPassword", e.target.value)}
                className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                  formData.confirmPassword &&
                  formData.password !== formData.confirmPassword
                    ? "border-red-300 focus:ring-red-400 pr-16"
                    : formData.confirmPassword &&
                      formData.password === formData.confirmPassword &&
                      formData.confirmPassword.length > 0
                    ? "border-green-300 focus:ring-green-400 pr-16"
                    : "border-gray-300 focus:ring-green-400 pr-12"
                }`}
                disabled={loading}
                autoComplete="new-password"
                required
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                  disabled={loading}
                  tabIndex="-1"
                >
                  {showConfirmPassword ? "🙈" : "👁️"}
                </button>
                {formData.confirmPassword && (
                  <span>
                    {formData.password === formData.confirmPassword &&
                    formData.confirmPassword.length > 0 ? (
                      <span className="text-green-500">✅</span>
                    ) : (
                      <span className="text-red-500">❌</span>
                    )}
                  </span>
                )}
              </div>
            </div>

            {/* رسالة تطابق كلمات المرور */}
            {formData.confirmPassword &&
              formData.password !== formData.confirmPassword && (
                <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                  <span>❌</span>
                  كلمتا المرور غير متطابقتين
                </p>
              )}
            {formData.confirmPassword &&
              formData.password === formData.confirmPassword &&
              formData.confirmPassword.length > 0 && (
                <p className="text-green-600 text-xs mt-1 flex items-center gap-1">
                  <span>✅</span>
                  كلمتا المرور متطابقتان
                </p>
              )}
          </div>

          {/* زر إعادة تعيين كلمة المرور */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg text-white font-bold transition-all ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-500 hover:bg-green-600 hover:shadow-lg transform hover:-translate-y-0.5"
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                جاري إعادة التعيين...
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <span>🔑</span>
                إعادة تعيين كلمة المرور
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
              className="text-green-500 hover:text-green-600 font-semibold hover:underline transition-colors"
            >
              تسجيل الدخول
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
          بعد إعادة تعيين كلمة المرور، ستحتاج لتسجيل الدخول مرة أخرى
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