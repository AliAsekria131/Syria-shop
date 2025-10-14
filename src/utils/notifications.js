// utils/notifications.js
import { createClient } from '../../lib/supabase';

// جلب عدد الإشعارات غير المقروءة
export const getUnreadNotificationsCount = async (userId) => {
  const supabase = createClient();
  
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
    return { success: true, count: count || 0 };
  } catch (error) {
    console.error('خطأ في جلب عدد الإشعارات:', error);
    return { success: false, count: 0 };
  }
};

// جلب الإشعارات
export const getNotifications = async (userId, limit = 20) => {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    console.error('خطأ في جلب الإشعارات:', error);
    return { success: false, data: [] };
  }
};

// تحديد إشعار كمقروء
export const markNotificationAsRead = async (notificationId) => {
  const supabase = createClient();
  
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('خطأ في تحديث الإشعار:', error);
    return { success: false };
  }
};

// تحديد جميع الإشعارات كمقروءة
export const markAllNotificationsAsRead = async (userId) => {
  const supabase = createClient();
  
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('خطأ في تحديث الإشعارات:', error);
    return { success: false };
  }
};

// تحديد الرسائل كمقروءة
export const markMessagesAsRead = async (conversationId, userId) => {
  const supabase = createClient();
  
  try {
    // تحديث الرسائل
    const { error: messagesError } = await supabase
      .from('messages')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId)
      .eq('is_read', false);

    if (messagesError) throw messagesError;

    // تصفير العداد في المحادثة
    const { data: conv } = await supabase
      .from('conversations')
      .select('buyer_id, seller_id')
      .eq('id', conversationId)
      .single();

    if (conv) {
      const isBuyer = conv.buyer_id === userId;
      const updateField = isBuyer ? 'unread_count_buyer' : 'unread_count_seller';
      
      await supabase
        .from('conversations')
        .update({ [updateField]: 0 })
        .eq('id', conversationId);
    }

    return { success: true };
  } catch (error) {
    console.error('خطأ في تحديد الرسائل كمقروءة:', error);
    return { success: false };
  }
};