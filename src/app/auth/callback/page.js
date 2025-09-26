"use client";

import { useEffect, useState, useRef } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AuthCallback() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const [attempts, setAttempts] = useState(0);
  const timeoutRef = useRef(null);
  const processedRef = useRef(false); // منع التنفيذ المتعدد

  // الحد الأقصى للمحاولات والوقت المسموح
  const MAX_ATTEMPTS = 3;
  const CALLBACK_TIMEOUT = 15000; // 15 ثانية
  const REDIRECT_DELAY = 3000; // 3 ثواني

  // قائمة المسارات المسموحة لإعادة التوجيه
  const ALLOWED_REDIRECT_PATHS = [
    '/main',
    '/dashboard', 
    '/profile',
    '/',
    '/welcome'
  ];

  /**
   * التحقق من صحة مسار إعادة التوجيه
   * @param {string} path - المسار المراد التحقق منه
   * @returns {string} - المسار الآمن
   */
  const getSecureRedirectPath = () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const redirectTo = urlParams.get('redirect_to') || urlParams.get('next');
      
      // التأكد من أن المسار يبدأ بـ / وليس URL خارجي
      if (redirectTo && typeof redirectTo === 'string') {
        // إزالة أي محاولات للخروج من النطاق
        const cleanPath = redirectTo.split('?')[0].split('#')[0];
        
        // التحقق من أن المسار في القائمة المسموحة
        if (ALLOWED_REDIRECT_PATHS.includes(cleanPath)) {
          return cleanPath;
        }
      }
      
      return '/main'; // المسار الافتراضي الآمن
    } catch (error) {
      // في حالة أي خطأ، استخدم المسار الافتراضي
      console.warn('Error parsing redirect path:', error.message);
      return '/main';
    }
  };

  /**
   * التحقق من state parameter لمنع CSRF
   * @returns {boolean} - هل الـ state صحيح
   */
  const validateStateParameter = () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const stateParam = urlParams.get('state');
      
      if (!stateParam) {
        // إذا لم يكن هناك state، قد يكون email confirmation
        return true;
      }
      
      const storedState = sessionStorage.getItem('oauth_state');
      
      if (!storedState) {
        console.warn('No stored state found for OAuth callback');
        return false;
      }
      
      return stateParam === storedState;
    } catch (error) {
      console.warn('State validation error:', error.message);
      return false;
    }
  };

  /**
   * تسجيل الأحداث الأمنية بشكل آمن
   * @param {string} event - نوع الحدث
   * @param {object} details - تفاصيل إضافية
   */
  const logSecurityEvent = (event, details = {}) => {
    const logData = {
      event,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent.substring(0, 100), // تحديد الطول
      url: window.location.href,
      ...details
    };
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Security Event:', logData);
    }
    
    // في الإنتاج، يمكن إرسال هذا لخدمة logging
    // sendToLoggingService(logData);
  };

  /**
   * التحقق من صحة session وbrowser fingerprint
   * @param {object} session - جلسة المستخدم
   * @returns {boolean} - هل الجلسة صحيحة
   */
  const validateSession = async (session) => {
    try {
      if (!session?.user?.id) {
        return false;
      }

      // التحقق من انتهاء صلاحية الـ token
      if (session.expires_at && session.expires_at < Date.now() / 1000) {
        logSecurityEvent('expired_token', { userId: session.user.id });
        return false;
      }

      // التحقق من email verification للحسابات الجديدة
      if (!session.user.email_confirmed_at && session.user.created_at) {
        const createdAt = new Date(session.user.created_at);
        const now = new Date();
        const diffHours = (now - createdAt) / (1000 * 60 * 60);
        
        // إذا مر أكثر من 24 ساعة ولم يتم تأكيد الإيميل
        if (diffHours > 24) {
          logSecurityEvent('unverified_email_timeout', { userId: session.user.id });
          return false;
        }
      }

      return true;
    } catch (error) {
      logSecurityEvent('session_validation_error', { error: error.message });
      return false;
    }
  };

  /**
   * معالجة callback بشكل آمن
   */
  const handleAuthCallback = async () => {
    // منع التنفيذ المتعدد
    if (processedRef.current) {
      return;
    }
    processedRef.current = true;

    // فحص عدد المحاولات
    if (attempts >= MAX_ATTEMPTS) {
      setStatus("error");
      setMessage("تم تجاوز الحد المسموح من المحاولات. يرجى إعادة تحميل الصفحة.");
      logSecurityEvent('max_attempts_exceeded');
      return;
    }

    // إعداد timeout
    timeoutRef.current = setTimeout(() => {
      if (status === "loading") {
        setStatus("error");
        setMessage("انتهت مهلة العملية. يرجى المحاولة مرة أخرى.");
        logSecurityEvent('callback_timeout');
      }
    }, CALLBACK_TIMEOUT);

    try {
      // التحقق من CSRF state
      if (!validateStateParameter()) {
        throw new Error('Invalid state parameter - potential CSRF attack');
      }

      // الحصول على الجلسة من Supabase
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        logSecurityEvent('auth_callback_error', { 
          error: error.message,
          code: error.status 
        });
        
        setAttempts(prev => prev + 1);
        setStatus("error");
        
        // رسائل خطأ محددة بدون كشف تفاصيل تقنية
        if (error.message?.includes('Invalid')) {
          setMessage("رابط التأكيد غير صالح أو منتهي الصلاحية.");
        } else if (error.message?.includes('expired')) {
          setMessage("انتهت صلاحية رابط التأكيد. يرجى طلب رابط جديد.");
        } else {
          setMessage("حدث خطأ في تأكيد الحساب. يرجى المحاولة مرة أخرى.");
        }
        return;
      }

      if (data?.session?.user) {
        // التحقق من صحة الجلسة
        const isValidSession = await validateSession(data.session);
        
        if (!isValidSession) {
          throw new Error('Invalid session detected');
        }

        // مسح OAuth state إذا وُجد
        sessionStorage.removeItem('oauth_state');
        
        // تسجيل نجاح العملية
        logSecurityEvent('successful_auth_callback', { 
          userId: data.session.user.id,
          email: data.session.user.email 
        });
        
        setStatus("success");
        setMessage("تم تأكيد حسابك بنجاح! جاري إعادة التوجيه...");
        
        // إعادة التوجيه الآمنة بعد تأخير
        setTimeout(() => {
          const safePath = getSecureRedirectPath();
          router.push(safePath);
        }, REDIRECT_DELAY);
        
      } else {
        logSecurityEvent('no_session_found');
        setStatus("error");
        setMessage("لم يتم العثور على جلسة صالحة. يرجى تسجيل الدخول مرة أخرى.");
      }
      
    } catch (err) {
      setAttempts(prev => prev + 1);
      
      logSecurityEvent('callback_exception', { 
        error: err.message,
        attempts: attempts + 1 
      });
      
      setStatus("error");
      
      // رسائل خطأ عامة لا تكشف تفاصيل النظام
      if (err.message?.includes('CSRF')) {
        setMessage("طلب غير آمن. يرجى البدء من جديد.");
      } else {
        setMessage("حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.");
      }
    } finally {
      // تنظيف timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  };

  useEffect(() => {
    handleAuthCallback();
    
    // تنظيف عند unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []); // dependency array فارغ لتنفيذ مرة واحدة فقط

  // Loading state
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
          {attempts > 0 && (
            <p className="text-sm text-orange-600 mt-2">
              المحاولة {attempts} من {MAX_ATTEMPTS}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Success state
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
            <Link 
              href={getSecureRedirectPath()} 
              className="text-blue-500 hover:underline font-medium"
            >
              انقر هنا للمتابعة
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Error state
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
        
        {attempts >= MAX_ATTEMPTS && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <p className="text-orange-800 text-sm">
              تم تجاوز الحد المسموح من المحاولات. يرجى إعادة تحميل الصفحة أو البدء من جديد.
            </p>
          </div>
        )}
        
        <div className="space-y-3">
          <Link
            href="/auth/login"
            className="block w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            تسجيل الدخول
          </Link>
          <Link
            href="/auth/signup"
            className="block w-full bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600 transition-colors font-medium"
          >
            إنشاء حساب جديد
          </Link>
          <button
            onClick={() => window.location.reload()}
            className="block w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition-colors font-medium"
          >
            إعادة المحاولة
          </button>
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