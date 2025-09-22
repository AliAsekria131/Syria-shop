"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AuthCallback() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [status, setStatus] = useState("loading"); // loading, success, error
  const [message, setMessage] = useState("");

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // التعامل مع callback من Supabase
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Auth callback error:", error);
          setStatus("error");
          setMessage("حدث خطأ في تأكيد الحساب. يرجى المحاولة مرة أخرى.");
          return;
        }

        if (data?.session?.user) {
          // تم تأكيد الحساب بنجاح
          setStatus("success");
          setMessage("تم تأكيد حسابك بنجاح! جاري إعادة التوجيه...");
          
          // انتظار قصير قبل إعادة التوجيه
          setTimeout(() => {
            router.push("/main");
          }, 2000);
        } else {
          setStatus("error");
          setMessage("لم يتم العثور على جلسة صالحة. يرجى تسجيل الدخول مرة أخرى.");
        }
        
      } catch (err) {
        console.error("Callback handling error:", err);
        setStatus("error");
        setMessage("حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.");
      }
    };

    handleAuthCallback();
  }, [supabase, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6">
            <div className="w-full h-full border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            جاري تأكيد الحساب...
          </h1>
          <p className="text-gray-600">
            يرجى الانتظار بينما نقوم بتأكيد حسابك
          </p>
        </div>
      </div>
    );
  }

  if (status === "success") {
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
            {message}
          </p>
          <div className="text-sm text-gray-600">
            إذا لم يتم إعادة التوجيه تلقائياً،{" "}
            <Link href="/main" className="text-blue-500 hover:underline font-medium">
              انقر هنا للمتابعة
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // status === "error"
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
          <span className="text-3xl">❌</span>
        </div>
        <h1 className="text-2xl font-bold text-red-800 mb-4">
          فشل في التأكيد
        </h1>
        <p className="text-red-700 mb-6">
          {message}
        </p>
        <div className="space-y-3">
          <Link
            href="/login"
            className="block w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            تسجيل الدخول
          </Link>
          <Link
            href="/signup"
            className="block w-full bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600 transition-colors font-medium"
          >
            إنشاء حساب جديد
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