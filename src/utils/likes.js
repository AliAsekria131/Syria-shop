// utils/likes.js
import { createClient } from '../../lib/supabase';

// إضافة إعجاب
export const addLike = async (userId, adId) => {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from('likes')
      .insert([
        {
          user_id: userId,
          ad_id: adId
        }
      ])
      .select();

    if (error) {
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('خطأ في إضافة الإعجاب:', error);
    return { success: false, error: error.message };
  }
};

// إزالة إعجاب
export const removeLike = async (userId, adId) => {
 const supabase = createClient();
  
  try {
    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('user_id', userId)
      .eq('ad_id', adId);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('خطأ في إزالة الإعجاب:', error);
    return { success: false, error: error.message };
  }
};

// التحقق من وجود إعجاب
export const checkLike = async (userId, adId) => {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from('likes')
      .select('id')
      .eq('user_id', userId)
      .eq('ad_id', adId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error;
    }

    return { success: true, liked: !!data };
  } catch (error) {
    console.error('خطأ في التحقق من الإعجاب:', error);
    return { success: false, error: error.message, liked: false };
  }
};

// جلب عدد الإعجابات للإعلان
export const getLikesCount = async (adId) => {
  const supabase = createClient();
  
  try {
    const { count, error } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('ad_id', adId);

    if (error) {
      throw error;
    }

    return { success: true, count: count || 0 };
  } catch (error) {
    console.error('خطأ في جلب عدد الإعجابات:', error);
    return { success: false, error: error.message, count: 0 };
  }
};

// جلب المنتجات المُعجب بها للمستخدم
export const getUserLikedProducts = async (userId, limit = 20, offset = 0) => {
 const supabase = createClient();
  
  try {
    // الطريقة الأولى: محاولة الاستعلام مع العلاقة
    const { data, error } = await supabase
      .from('likes')
      .select(`
        id,
        created_at,
        ad_id,
        ads!inner (
          id,
          title,
          description,
          price,
          currency,
          location,
          category,
          image_urls,
          created_at,
          status,
          expires_at,
          user_id
        )
      `)
      .eq('user_id', userId)
      .eq('ads.status', 'active')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      // في حالة فشل الاستعلام مع العلاقة، استخدم طريقة أخرى
      return await getUserLikedProductsAlternative(userId, limit, offset);
    }

    // إضافة بيانات المستخدم لكل إعلان
    const enrichedData = await Promise.all(
      data.map(async (like) => {
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', like.ads.user_id)
          .single();

        return {
          ...like,
          ads: {
            ...like.ads,
            profiles: userProfile || { full_name: null, avatar_url: null }
          }
        };
      })
    );

    return { 
      success: true, 
      data: enrichedData,
      count: enrichedData.length 
    };
  } catch (error) {
    console.error('خطأ في جلب المنتجات المُعجب بها:', error);
    return { success: false, error: error.message, data: [], count: 0 };
  }
};

// الطريقة البديلة في حالة عدم وجود العلاقات
const getUserLikedProductsAlternative = async (userId, limit = 20, offset = 0) => {
  const supabase = createClient();
  
  try {
    // أولاً: جلب الإعجابات
    const { data: likes, error: likesError } = await supabase
      .from('likes')
      .select('id, created_at, ad_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (likesError) {
      throw likesError;
    }

    if (!likes || likes.length === 0) {
      return { success: true, data: [], count: 0 };
    }

    // ثانياً: جلب الإعلانات
    const adIds = likes.map(like => like.ad_id);
    const { data: ads, error: adsError } = await supabase
      .from('ads')
      .select('*')
      .in('id', adIds)
      .eq('status', 'active');

    if (adsError) {
      throw adsError;
    }

    // ثالثاً: جلب بيانات المستخدمين
    const userIds = [...new Set(ads?.map(ad => ad.user_id) || [])];
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', userIds);

    if (profilesError) {
      console.warn('تعذر جلب بيانات المستخدمين:', profilesError);
    }

    // ربط البيانات
    const result = likes
      .map(like => {
        const ad = ads?.find(a => a.id === like.ad_id);
        if (!ad) return null;

        const profile = profiles?.find(p => p.id === ad.user_id);

        return {
          id: like.id,
          created_at: like.created_at,
          ads: {
            ...ad,
            profiles: profile || { full_name: null, avatar_url: null }
          }
        };
      })
      .filter(item => item !== null);

    return { 
      success: true, 
      data: result,
      count: result.length 
    };
  } catch (error) {
    console.error('خطأ في الطريقة البديلة:', error);
    return { success: false, error: error.message, data: [], count: 0 };
  }
};