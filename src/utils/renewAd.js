// utils/renewAd.js

/**
 * تجديد إعلان منتهي الصلاحية
 * @param {object} supabase - Supabase client
 * @param {string} adId - معرف الإعلان
 * @param {number} durationDays - مدة التجديد بالأيام (افتراضي 30 يوم)
 * @returns {Promise<object>} نتيجة التجديد
 */
export async function renewAd(supabase, adId, durationDays = 30) {
  try {
    // التحقق من وجود المعلمات المطلوبة
    if (!supabase || !adId) {
      throw new Error('معلمات غير صالحة');
    }

    // حساب تاريخ الصلاحية الجديد
    const now = new Date();
    const newExpiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

    // تحديث الإعلان في قاعدة البيانات
    const { data, error } = await supabase
      .from('ads')
      .update({
        status: 'active',
        expires_at: newExpiresAt.toISOString(),
        updated_at: now.toISOString()
      })
      .eq('id', adId)
      .select()
      .single();

    if (error) {
      console.error('خطأ في تجديد الإعلان:', error);
      throw new Error(error.message);
    }

    return {
      success: true,
      data,
      message: 'تم تجديد الإعلان بنجاح'
    };

  } catch (error) {
    console.error('خطأ في renewAd:', error);
    return {
      success: false,
      error: error.message,
      message: 'فشل تجديد الإعلان'
    };
  }
}

/**
 * التحقق من انتهاء صلاحية الإعلان
 * @param {string} expiresAt - تاريخ انتهاء الصلاحية
 * @returns {boolean} true إذا كان منتهي الصلاحية
 */
export function isAdExpired(expiresAt) {
  if (!expiresAt) return false;
  const expirationDate = new Date(expiresAt);
  const now = new Date();
  return expirationDate < now;
}

/**
 * حساب الأيام المتبقية للإعلان
 * @param {string} expiresAt - تاريخ انتهاء الصلاحية
 * @returns {number} عدد الأيام المتبقية (سالب إذا منتهي)
 */
export function getRemainingDays(expiresAt) {
  if (!expiresAt) return null;
  const expirationDate = new Date(expiresAt);
  const now = new Date();
  const diffTime = expirationDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}