// src/utils/auth.js
// مساعدات للتعامل مع المصادقة

/**
 * التحقق من حالة تسجيل الدخول
 * @param {Object} supabase - عميل Supabase
 * @returns {Promise<Object>} - معلومات المستخدم أو null
 */
export const getCurrentUser = async (supabase) => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error("Error getting user:", error);
      return null;
    }
    return user;
  } catch (error) {
    console.error("Error in getCurrentUser:", error);
    return null;
  }
};

/**
 * تسجيل خروج المستخدم
 * @param {Object} supabase - عميل Supabase
 * @param {Object} router - راوتر Next.js
 * @returns {Promise<boolean>} - نجح الخروج أم لا
 */
export const signOut = async (supabase, router) => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Sign out error:", error);
      return false;
    }
    
    // توجيه للصفحة الرئيسية
    if (router) {
      router.push('/');
    }
    
    return true;
  } catch (error) {
    console.error("Error in signOut:", error);
    return false;
  }
};

/**
 * التحقق من صلاحية تعديل المنتج
 * @param {Object} user - المستخدم الحالي
 * @param {string} productUserId - معرف صاحب المنتج
 * @returns {boolean} - هل يستطيع التعديل أم لا
 */
export const canEditProduct = (user, productUserId) => {
  if (!user) return false;
  return user.id === productUserId;
};

/**
 * التحقق من صحة جلسة المستخدم
 * @param {Object} supabase - عميل Supabase
 * @returns {Promise<boolean>} - هل الجلسة صحيحة أم لا
 */
export const isValidSession = async (supabase) => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    return !error && session !== null;
  } catch (error) {
    console.error("Error checking session:", error);
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
    (event, session) => {
      onAuthStateChange(event, session);
    }
  );
  
  return subscription;
};