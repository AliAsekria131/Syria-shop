// app/api/update-expired-ads/route.js
import { supabase } from '../../../../lib/supabaseClient';

export async function GET() {
  try {
    // تحديث الإعلانات المنتهية الصلاحية
    const { data, error } = await supabase
      .from('ads')
      .update({ status: 'expired' })
      .lt('expires_at', new Date().toISOString())
      .eq('status', 'active');

    if (error) {
      console.error('خطأ في تحديث الإعلانات:', error);
      return Response.json({ success: false, error: error.message }, { status: 500 });
    }

    return Response.json({ 
      success: true, 
      message: 'تم تحديث الإعلانات المنتهية الصلاحية',
      updatedCount: data?.length || 0
    });

  } catch (error) {
    console.error('خطأ عام:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}