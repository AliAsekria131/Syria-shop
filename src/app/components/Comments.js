// Comments.js - Pinterest Style
"use client";

import { useState, useEffect, useCallback} from "react";
import { MessageCircle, Send, X, ChevronDown, SendIcon } from "lucide-react";
import UserAvatar from './UserAvatar';

export default function Comments({ productId, currentUser, supabase, showMobile = false, onClose }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingComments, setFetchingComments] = useState(true);
  const [showAllComments, setShowAllComments] = useState(false);

  const fetchComments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("comments")
        .select(`
          *,
          profiles(full_name, avatar_url)
        `)
        .eq("product_id", productId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setFetchingComments(false);
    }
  }, [productId, supabase]);
  
  useEffect(() => {
    if (productId) {
      fetchComments();
    }
  }, [productId, fetchComments]);

  const addComment = async () => {
    if (!newComment.trim() || loading) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("comments")
        .insert([
          {
            product_id: productId,
            user_id: currentUser.id,
            comment_text: newComment.trim(),
          },
        ]);

      if (error) throw error;

      setNewComment("");
      fetchComments();
    } catch (error) {
      console.error("Error adding comment:", error);
      alert("حدث خطأ في إضافة التعليق");
    } finally {
      setLoading(false);
    }
  };

  const deleteComment = async (commentId) => {
    if (!confirm("هل أنت متأكد من حذف هذا التعليق؟")) return;

    try {
      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId)
        .eq("user_id", currentUser.id);

      if (error) throw error;
      fetchComments();
    } catch (error) {
      console.error("Error deleting comment:", error);
      alert("حدث خطأ في حذف التعليق");
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));

    if (diffDays > 0) {
      return `منذ ${diffDays} ${diffDays === 1 ? 'يوم' : 'أيام'}`;
    } else if (diffHours > 0) {
      return `منذ ${diffHours} ${diffHours === 1 ? 'ساعة' : 'ساعات'}`;
    } else if (diffMinutes > 0) {
      return `منذ ${diffMinutes} ${diffMinutes === 1 ? 'دقيقة' : 'دقائق'}`;
    } else {
      return 'الآن';
    }
  };

  if (showMobile) {
    return (
      <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-[9999]">
        <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-3xl" style={{ height: "90vh" }}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{comments.length} من التعليقات</h3>
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Comments List */}
          <div className="flex-1 overflow-y-auto p-4 pb-20">
            {fetchingComments ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-gray-500 dark:text-gray-400">جاري تحميل التعليقات...</p>
              </div>
            ) : comments.length > 0 ? comments.map((comment) => (
              <div key={comment.id} className="flex gap-3 mb-6">
                <UserAvatar src={comment.profiles?.avatar_url} alt="مستخدم" size={40} />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-gray-900 dark:text-white">
                        {comment.profiles?.full_name || "مستخدم"}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(comment.created_at)}
                      </span>
                    </div>
                    {comment.user_id === currentUser.id && (
                      <button
                        onClick={() => deleteComment(comment.id)}
                        className="text-red-500 dark:text-red-400 text-sm"
                      >
                        حذف
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-200">
                    {comment.comment_text}
                  </p>
                </div>
              </div>
            )) : (
              <div className="text-center py-8">
                <MessageCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">لا توجد تعليقات بعد</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">كن أول من يضيف تعليقاً</p>
              </div>
            )}
          </div>

          {/* Add Comment - Fixed at bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
            <div className="flex gap-3 items-center">
              <UserAvatar src={currentUser?.avatar_url} alt="أنت" size={40} />
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  placeholder="أضف تعليقاً..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addComment()}
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-full focus:outline-none focus:ring-2 focus:ring-red-500"
                  disabled={loading}
                />
                {newComment.trim() && (
                  <button
                    onClick={addComment}
                    disabled={loading}
                    className="px-4 py-3 bg-red-500 text-white rounded-full hover:bg-red-600 disabled:opacity-50 flex items-center justify-center"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-gray-300 dark:border-gray-700 pt-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 dark:text-white">التعليقات ({comments.length})</h3>
        {comments.length > 1 && (
          <button 
            onClick={() => setShowAllComments(!showAllComments)}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 flex items-center gap-1"
          >
            <ChevronDown className={`w-5 h-5 transition-transform ${showAllComments ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      {comments.length > 0 ? (
        <div className="mb-4 space-y-3">
          {/* التعليق الأول دائماً */}
          <div className="flex gap-3">
            <UserAvatar src={comments[0].profiles?.avatar_url} alt="مستخدم" size={32} />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-gray-900 dark:text-white">
                    {comments[0].profiles?.full_name || "مستخدم"}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(comments[0].created_at)}
                  </span>
                </div>
                {comments[0].user_id === currentUser.id && (
                  <button
                    onClick={() => deleteComment(comments[0].id)}
                    className="text-red-500 dark:text-red-400 text-xs hover:text-red-600 dark:hover:text-red-300"
                  >
                    حذف
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-200">{comments[0].comment_text}</p>
            </div>
          </div>
          
          {/* باقي التعليقات عند الضغط على السهم */}
          {showAllComments && comments.slice(1).map((comment) => (
            <div key={comment.id} className="flex gap-3 border-t border-gray-200 dark:border-gray-700 pt-3">
              <UserAvatar 
                src={comment.profiles?.avatar_url} 
                alt="مستخدم" 
                size={32} 
              />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-gray-900 dark:text-white">
                      {comment.profiles?.full_name || "مستخدم"}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(comment.created_at)}
                    </span>
                  </div>
                  {comment.user_id === currentUser.id && (
                    <button
                      onClick={() => deleteComment(comment.id)}
                      className="text-red-500 dark:text-red-400 text-xs hover:text-red-600 dark:hover:text-red-300"
                    >
                      حذف
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-200">{comment.comment_text}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">لا توجد تعليقات بعد</p>
      )}

      {/* صندوق إضافة تعليق */}
      <div className="flex gap-3">
        <UserAvatar 
          src={currentUser?.avatar_url} 
          alt="أنت" 
          size={32} 
        />
        <div className="flex flex-1 items-center gap-2">
          <input
            type="text"
            placeholder="أضف تعليقاً..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addComment()}
            className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white rounded-full focus:outline-none text-sm border border-gray-300 dark:border-gray-600"
            disabled={loading}
          />
          <button
            onClick={addComment}
            disabled={loading}
            className="p-1.5 rounded-full bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
          >
            <SendIcon size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}