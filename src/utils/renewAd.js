// utils/renewAd.js
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export async function renewAd(adId) {
  const supabase = createClientComponentClient();
  
  try {
    // تجديد الإعلان لـ 7 أيام إضافية
    const newExpiryDate = new Date();
    //newExpiryDate.setDate(newExpiryDate.getDate() + 7);
	newExpiryDate.setDate(newExpiryDate.getDate() + 7);

    const { data, error } = await supabase
      .from('ads')
      .update({ 
        expires_at: newExpiryDate.toISOString(),
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', adId);

    if (error) {
      throw error;
    }

    return { success: true, message: 'تم تجديد الإعلان بنجاح' };
  } catch (error) {
    console.error('خطأ في تجديد الإعلان:', error);
    return { success: false, message: 'حدث خطأ في تجديد الإعلان' };
  }
}