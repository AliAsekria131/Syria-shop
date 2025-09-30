// src/utils/auth.js
// مساعدات للتعامل مع المصادقة - نسخة مبسطة وآمنة

// ============================================
// إعدادات الأمان الأساسية
// ============================================
const SESSION_REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 دقائق قبل الانتهاء

// ============================================
// دالة تسجيل الأخطاء الآمنة
// ============================================
const logSecureError = (context, error) => {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[${context}]`, error);
  } else {
    // في الإنتاج، نسجل فقط رسالة عامة لحماية المعلومات الحساسة
    console.error(`[${context}] Operation failed`);
    // يمكن إرسال الخطأ الكامل لخدمة monitoring مثل Sentry
  }
};

// ============================================
// دوال المصادقة الأساسية
// ============================================

/**
 * التحقق من حالة تسجيل الدخول
 * @param {Object} supabase - عميل Supabase
 * @returns {Promise<Object>} - معلومات المستخدم أو null
 */
export const getCurrentUser = async (supabase) => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      logSecureError("getCurrentUser", error);
      return null;
    }

    return user;
  } catch (error) {
    logSecureError("getCurrentUser", error);
    return null;
  }
};

/**
 * تسجيل خروج المستخدم
 * @param {Object} supabase - عميل Supabase
 * @param {Object} router - راوتر Next.js (اختياري)
 * @returns {Promise<boolean>} - نجح الخروج أم لا
 */
export const signOut = async (supabase, router = null) => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      logSecureError("signOut", error);
      return false;
    }
    
    // مسح sessionStorage إذا كان متاحاً
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.clear();
      } catch (e) {
        // تجاهل الأخطاء
      }
    }
    
    // توجيه للصفحة الرئيسية
    if (router) {
      router.push('/');
    }
    
    return true;
  } catch (error) {
    logSecureError("signOut", error);
    return false;
  }
};

/**
 * التحقق من صلاحية تعديل المنتج
 * @param {Object} supabase - عميل Supabase
 * @param {Object} user - المستخدم الحالي
 * @param {string} productId - معرف المنتج
 * @returns {Promise<Object>} - نتيجة الفحص
 */
export const canEditProduct = async (supabase, user, productId) => {
  try {
    // فحص أساسي
    if (!user || !productId) {
      return { 
        canEdit: false, 
        message: 'بيانات غير كاملة' 
      };
    }

    // جلب معلومات المنتج من قاعدة البيانات للتحقق من الملكية
    const { data: product, error } = await supabase
      .from('ads')
      .select('user_id, status, expires_at')
      .eq('id', productId)
      .single();

    if (error || !product) {
      logSecureError("canEditProduct", error);
      return { 
        canEdit: false, 
        message: 'المنتج غير موجود' 
      };
    }

    // التحقق من أن المستخدم هو صاحب المنتج
    if (user.id !== product.user_id) {
      return { 
        canEdit: false, 
        message: 'ليس لديك صلاحية لتعديل هذا المنتج' 
      };
    }

    // التحقق من حالة المنتج
    if (product.status === 'deleted') {
      return { 
        canEdit: false, 
        message: 'لا يمكن تعديل منتج محذوف' 
      };
    }

    // التحقق من انتهاء صلاحية الإعلان
    if (product.expires_at && new Date(product.expires_at) < new Date()) {
      return { 
        canEdit: false, 
        message: 'انتهت صلاحية هذا الإعلان' 
      };
    }

    return { 
      canEdit: true, 
      message: 'لديك صلاحية التعديل' 
    };

  } catch (error) {
    logSecureError("canEditProduct", error);
    return { 
      canEdit: false, 
      message: 'حدث خطأ أثناء التحقق من الصلاحيات' 
    };
  }
};

/**
 * التحقق من صحة جلسة المستخدم
 * @param {Object} supabase - عميل Supabase
 * @returns {Promise<Object>} - معلومات الجلسة
 */
export const isValidSession = async (supabase) => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      return { 
        isValid: false, 
        shouldRefresh: false 
      };
    }

    const now = Date.now();
    const expiresAt = new Date(session.expires_at).getTime();
    const timeUntilExpiry = expiresAt - now;

    // إذا انتهت الجلسة
    if (timeUntilExpiry <= 0) {
      return { 
        isValid: false, 
        shouldRefresh: true 
      };
    }

    // إذا كانت الجلسة قريبة من الانتهاء (أقل من 5 دقائق)
    if (timeUntilExpiry < SESSION_REFRESH_THRESHOLD) {
      return { 
        isValid: true, 
        shouldRefresh: true 
      };
    }

    return { 
      isValid: true, 
      shouldRefresh: false 
    };

  } catch (error) {
    logSecureError("isValidSession", error);
    return { 
      isValid: false, 
      shouldRefresh: false 
    };
  }
};

/**
 * تجديد الجلسة
 * @param {Object} supabase - عميل Supabase
 * @returns {Promise<boolean>} - نجح التجديد أم لا
 */
export const refreshSession = async (supabase) => {
  try {
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      logSecureError("refreshSession", error);
      return false;
    }

    return data?.session !== null;
  } catch (error) {
    logSecureError("refreshSession", error);
    return false;
  }
};

/**
 * مراقبة تغييرات حالة المصادقة
 * @param {Object} supabase - عميل Supabase
 * @param {Function} onAuthStateChange - دالة تستدعى عند التغيير
 * @returns {Object} - كائن الإلغاء
 */
export const setupAuthListener = (supabase, onAuthStateChange) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      // التحقق من صحة الجلسة وتجديدها تلقائياً إذا لزم الأمر
      if (session) {
        const sessionCheck = await isValidSession(supabase);
        
        // تجديد الجلسة إذا كانت قريبة من الانتهاء
        if (sessionCheck.shouldRefresh && sessionCheck.isValid) {
          await refreshSession(supabase);
        }
        
        // تسجيل الخروج إذا كانت الجلسة غير صالحة
        if (!sessionCheck.isValid && !sessionCheck.shouldRefresh) {
          await supabase.auth.signOut();
          return;
        }
      }

      onAuthStateChange(event, session);
    }
  );
  
  return subscription;
};

// ============================================
// دوال مساعدة إضافية
// ============================================

/**
 * التحقق من ملكية المورد (عام لأي جدول)
 * @param {Object} supabase - عميل Supabase
 * @param {Object} user - المستخدم الحالي
 * @param {string} table - اسم الجدول
 * @param {string} resourceId - معرف المورد
 * @returns {Promise<boolean>} - هل يملك المورد
 */
export const isResourceOwner = async (supabase, user, table, resourceId) => {
  if (!user || !resourceId) return false;

  try {
    const { data, error } = await supabase
      .from(table)
      .select('user_id')
      .eq('id', resourceId)
      .single();

    if (error || !data) {
      logSecureError("isResourceOwner", error);
      return false;
    }

    return data.user_id === user.id;
  } catch (error) {
    logSecureError("isResourceOwner", error);
    return false;
  }
};

/**
 * التحقق من صحة البريد الإلكتروني (للاستخدام في client-side validation)
 * @param {string} email - البريد الإلكتروني
 * @returns {boolean} - هل البريد صحيح
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * التحقق من قوة كلمة المرور (للاستخدام في client-side validation)
 * @param {string} password - كلمة المرور
 * @returns {Object} - معلومات عن قوة كلمة المرور
 */
export const checkPasswordStrength = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const strength = {
    isValid: password.length >= minLength,
    length: password.length >= minLength,
    hasUpperCase,
    hasLowerCase,
    hasNumbers,
    hasSpecialChar,
    score: 0
  };

  if (strength.length) strength.score++;
  if (strength.hasUpperCase) strength.score++;
  if (strength.hasLowerCase) strength.score++;
  if (strength.hasNumbers) strength.score++;
  if (strength.hasSpecialChar) strength.score++;

  return strength;
};