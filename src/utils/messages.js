// utils/messages.js
import { createClient } from '@/lib/supabase/client';

// جلب عدد الرسائل غير المقروءة للمستخدم
export const getUnreadMessagesCount = async (userId) => {
  const supabase = createClient();
  
  try {
    // طريقة مباشرة أبسط
    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false)
      .neq('sender_id', userId); // الرسائل التي لم يرسلها المستخدم

    if (error) throw error;
    
    return { success: true, count: count || 0 };
  } catch (error) {
    console.error('خطأ في جلب عدد الرسائل:', error);
    return { success: false, count: 0 };
  }
};

// تحديد رسائل المحادثة كمقروءة
export const markConversationAsRead = async (conversationId, userId) => {
  const supabase = createClient();
  
  try {
    // تحديث الرسائل
    const { error: messagesError } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId)
      .eq('is_read', false);

    if (messagesError) throw messagesError;

    // تصفير العداد
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