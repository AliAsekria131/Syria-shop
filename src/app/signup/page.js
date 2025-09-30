"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";

export default function SignUp() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  // الحالات
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(true); // حالة جديدة للتحقق من المصادقة

  // التحقق من المصادقة عند تحميل الصفحة
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        router.replace("/main"); // استخدم replace لتجنب الرجوع لصفحة التسجيل
      } else {
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, [supabase, router]);

  // دالة التحقق من صحة البيانات
  const validateForm = () => {
    const newErrors = [];
    const { full_name, phone, email, password, confirmPassword } = formData;

    if (!full_name.trim()) {
      newErrors.push("اسم المستخدم مطلوب");
    }
    if (!phone.trim()) {
      newErrors.push("رقم الهاتف مطلوب");
    }
    if (!email.trim()) {
      newErrors.push("البريد الإلكتروني مطلوب");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.push("البريد الإلكتروني غير صحيح");
    }

    if (!password) {
      newErrors.push("كلمة المرور مطلوبة");
    } else {
      if (password.length < 6) {
        newErrors.push("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      }
      if (password.length > 50) {
        newErrors.push("كلمة المرور طويلة جداً");
      }
      if (!/(?=.*[a-zA-Z])/.test(password)) {
        newErrors.push("كلمة المرور يجب أن تحتوي على حرف واحد على الأقل");
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

  // دالة إعادة إرسال رسالة التأكيد
  const resendConfirmation = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: userEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setErrors(["فشل في إعادة إرسال رسالة التأكيد"]);
      } else {
        alert("تم إعادة إرسال رسالة التأكيد بنجاح!");
      }
    } catch (err) {
      setErrors(["حدث خطأ غير متوقع"]);
    } finally {
      setLoading(false);
    }
  };

  // دالة إنشاء الحساب
  const handleSignUp = async (e) => {
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

      // محاولة انشاء حساب
      const { data, error } = await supabase.auth.signUp({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name.trim(),
            phone: formData.phone.trim(),
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        let errorMessage = "حدث خطأ في إنشاء الحساب";

        if (error.message.includes("User already registered")) {
          errorMessage = "هذا البريد الإلكتروني مسجل مسبقاً";
        } else if (
          error.message.includes("Password should be at least 6 characters")
        ) {
          errorMessage = "كلمة المرور يجب أن تكون 6 أحرف على الأقل";
        } else if (error.message.includes("Invalid email")) {
          errorMessage = "البريد الإلكتروني غير صحيح";
        }

        setErrors([errorMessage]);
        return;
      }

      // نجح إنشاء الحساب - انتقال لصفحة التأكيد
      setUserEmail(formData.email);
      setRegistrationComplete(true);

      // مسح بيانات النموذج
      setFormData({
        full_name: "",
        phone: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
    } catch (err) {
      console.error("SignUp error:", err);
      setErrors(["حدث خطأ غير متوقع"]);
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = getPasswordStrength(formData.password);

  // عرض شاشة تحميل أثناء التحقق من المصادقة
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحقق من الجلسة...</p>
        </div>
      </div>
    );
  }

  // إذا تم التسجيل بنجاح، عرض صفحة التأكيد
  if (registrationComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
          {/* أيقونة البريد */}
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-4xl">📧</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              تحقق من بريدك الإلكتروني
            </h1>
          </div>

          {/* رسالة التأكيد */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <p className="text-gray-700 mb-4">تم إرسال رسالة تأكيد إلى:</p>
            <p className="font-bold text-blue-600 text-lg mb-4">{userEmail}</p>
            <div className="text-sm text-gray-600 space-y-2">
              <p>📌 اتبع الخطوات التالية:</p>
              <div className="text-right space-y-1 bg-gray-50 rounded p-3">
                <p>1️⃣ افتح بريدك الإلكتروني</p>
                <p>2️⃣ ابحث عن رسالة من موقعنا</p>
                <p>3️⃣ اضغط على رابط "تأكيد الحساب"</p>
                <p>4️⃣ ستتم إعادة توجيهك تلقائياً</p>
              </div>
            </div>
          </div>

          {/* أزرار الإجراءات */}
          <div className="space-y-3">
            <button
              onClick={resendConfirmation}
              disabled={loading}
              className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400"
            >
              {loading ? "جاري الإرسال..." : "إعادة إرسال رسالة التأكيد"}
            </button>

            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                لم تجد الرسالة؟ تحقق من مجلد البريد المزعج
              </p>

              <Link
                href="/auth/forgot-password"
                className="text-blue-500 hover:text-blue-600 text-sm hover:underline block"
              >
                مشاكل في الوصول للحساب؟
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
              لن تتمكن من تسجيل الدخول حتى تؤكد حسابك من خلال البريد الإلكتروني
            </p>
          </div>
        </div>
      </div>
    );
  }

  // نموذج التسجيل العادي
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        {/* رأس الصفحة */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">انضم إلينا</h1>
          <p className="text-gray-600">أنشئ حساب جديد وابدأ التسوق</p>
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

        {/* نموذج إنشاء الحساب */}
        <form onSubmit={handleSignUp} className="space-y-6">
          {/* اسم المستخدم */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              الاسم الكامل *
            </label>
            <input
              type="text"
              placeholder="ادخل اسمك الكامل"
              value={formData.full_name}
              onChange={(e) => updateField("full_name", e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all"
              disabled={loading}
              required
            />
          </div>

          {/* رقم الهاتف */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              رقم الهاتف *
            </label>
            <input
              type="tel"
              placeholder="+963 XXX XXX XXX"
              value={formData.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all"
              disabled={loading}
              required
            />
          </div>

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
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all"
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
                className="w-full p-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all"
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
              تأكيد كلمة المرور *
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

          {/* زر إنشاء الحساب */}
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
                جاري إنشاء الحساب...
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <span>🎉</span>
                إنشاء الحساب
              </div>
            )}
          </button>
        </form>

        {/* روابط إضافية */}
        <div className="mt-8 text-center space-y-4">
          <div className="text-gray-600">
            لديك حساب مسبقاً؟{" "}
            <Link
              href="/login"
              className="text-green-500 hover:text-green-600 font-semibold hover:underline transition-colors"
            >
              سجل دخولك من هنا
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

        {/* معلومات قانونية */}
        <div className="mt-8 text-center text-xs text-gray-500 leading-relaxed">
          بإنشاء حساب، فإنك توافق على{" "}
          <a href="#" className="text-blue-500 hover:underline">
            شروط الخدمة
          </a>{" "}
          و{" "}
          <a href="#" className="text-blue-500 hover:underline">
            سياسة الخصوصية
          </a>{" "}
          الخاصة بنا.
        </div>
      </div>
    </div>
  );
}
