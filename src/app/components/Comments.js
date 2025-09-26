// Comments.js - Pinterest Style
"use client";

import { useState, useEffect } from "react";
import { MessageCircle, Send, X, ChevronDown, SendIcon } from "lucide-react";

export default function Comments({ productId, currentUser, supabase, isOwner, showMobile = false, onClose }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingComments, setFetchingComments] = useState(true);
  const [showAllComments, setShowAllComments] = useState(false);

  // جلب التعليقات
  useEffect(() => {
    if (productId) {
      fetchComments();
    }
  }, [productId]);

  const fetchComments = async () => {
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
  };

  // إضافة تعليق جديد
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

  // حذف تعليق
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

  // إذا كان في وضع الموبايل، أعرض النافذة المنبثقة
  if (showMobile) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999]">
        <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl" style={{ height: "90vh" }}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-bold">{comments.length} من التعليقات</h3>
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Comments List */}
          <div className="flex-1 overflow-y-auto p-4 pb-20">
            {fetchingComments ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-gray-500">جاري تحميل التعليقات...</p>
              </div>
            ) : comments.length > 0 ? comments.map((comment) => (
              <div key={comment.id} className="flex gap-3 mb-6">
                <img
                  src={comment.profiles?.avatar_url || "/avatar.svg"}
                  alt="مستخدم"
                  className="w-10 h-10 rounded-full object-cover bg-gray-100"
                  onError={(e) => { e.target.src = "/avatar.svg"; }}
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">
                        {comment.profiles?.full_name || "مستخدم"}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(comment.created_at)}
                      </span>
                    </div>
                    {comment.user_id === currentUser.id && (
                      <button
                        onClick={() => deleteComment(comment.id)}
                        className="text-red-500 text-sm"
                      >
                        حذف
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-700">
                    {comment.comment_text}
                  </p>
                </div>
              </div>
            )) : (
              <div className="text-center py-8">
                <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">لا توجد تعليقات بعد</p>
                <p className="text-sm text-gray-400 mt-1">كن أول من يضيف تعليقاً</p>
              </div>
            )}
          </div>

          {/* Add Comment - Fixed at bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
            <div className="flex gap-3 items-center">
              <img
                src={currentUser?.avatar_url || "/avatar.svg"}
                alt="أنت"
                className="w-10 h-10 rounded-full object-cover bg-gray-100"
                onError={(e) => { e.target.src = "/avatar.svg"; }}
              />
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  placeholder="أضف تعليقاً..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addComment()}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-red-500"
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

  // عرض سطح المكتب - معاينة في البطاقة الرئيسية
  return (
    <div className="border-t border-gray-300 pt-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">التعليقات ({comments.length})</h3>
        {comments.length > 1 && (
          <button 
            onClick={() => setShowAllComments(!showAllComments)}
            className="text-gray-400 hover:text-gray-600 flex items-center gap-1"
          >
            <ChevronDown className={`w-5 h-5 transition-transform ${showAllComments ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      {/* معاينة التعليق الأول */}
      {/* عرض التعليقات */}
      {comments.length > 0 ? (
        <div className="mb-4 space-y-3">
          {/* التعليق الأول دائماً */}
          <div className="flex gap-3">
            <img
              src={comments[0].profiles?.avatar_url || "/avatar.svg"}
              alt="مستخدم"
              className="w-8 h-8 rounded-full object-cover bg-gray-100"
              onError={(e) => { e.target.src = "/avatar.svg"; }}
            />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-gray-900">
                    {comments[0].profiles?.full_name || "مستخدم"}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDate(comments[0].created_at)}
                  </span>
                </div>
                {comments[0].user_id === currentUser.id && (
                  <button
                    onClick={() => deleteComment(comments[0].id)}
                    className="text-red-500 text-xs hover:text-red-600"
                  >
                    حذف
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-700">{comments[0].comment_text}</p>
            </div>
          </div>
          
          {/* باقي التعليقات عند الضغط على السهم */}
          {showAllComments && comments.slice(1).map((comment) => (
            <div key={comment.id} className="flex gap-3 border-t pt-3">
              <img
                src={comment.profiles?.avatar_url || "/avatar.svg"}
                alt="مستخدم"
                className="w-8 h-8 rounded-full object-cover bg-gray-100"
                onError={(e) => { e.target.src = "/avatar.svg"; }}
              />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-gray-900">
                      {comment.profiles?.full_name || "مستخدم"}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(comment.created_at)}
                    </span>
                  </div>
                  {comment.user_id === currentUser.id && (
                    <button
                      onClick={() => deleteComment(comment.id)}
                      className="text-red-500 text-xs hover:text-red-600"
                    >
                      حذف
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-700">{comment.comment_text}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 mb-4">لا توجد تعليقات بعد</p>
      )}

      {/* صندوق إضافة تعليق */}
      <div className="flex gap-3">
  <img
    src={currentUser?.avatar_url || "/avatar.svg"}
    alt="أنت"
    className="w-8 h-8 rounded-full object-cover bg-gray-100"
    onError={(e) => { e.target.src = "/avatar.svg"; }}
  />
  <div className="flex flex-1 items-center gap-2">
   {/*  focus:bg-white focus:ring-2 focus:ring-red-500 */}
    <input
      type="text"
      placeholder="أضف تعليقاً..."
      value={newComment}
      onChange={(e) => setNewComment(e.target.value)}
      onKeyPress={(e) => e.key === 'Enter' && addComment()}
      className=" flex-1 px-3 py-2 bg-gray-50 rounded-full focus:outline-none text-sm  border border-gray-300"
      disabled={loading}
    />
    {/*newComment.trim() */}
      <button
        onClick={addComment}
        disabled={loading}
        className=" p-1.5 rounded-full bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
      >
        <SendIcon size={14} />
      </button>
    
  </div>
</div>

    </div>
  );
}