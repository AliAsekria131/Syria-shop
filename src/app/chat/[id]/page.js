// chat/[id]/page.js
"use client";

import { createClient } from '../../../../lib/supabase';
import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { Send, ArrowLeft, MoreVertical } from "lucide-react";

import { markConversationAsRead } from '@/utils/messages';

import AppLayout from "../../components/AppLayout";

export default function ChatPage() {
  const supabase = createClient();
  const router = useRouter();
  const params = useParams();
  const conversationId = params.id;
  
  const [currentUser, setCurrentUser] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  const messagesEndRef = useRef(null);
  const channelRef = useRef(null);
  const pollingInterval = useRef(null);

  // التمرير التلقائي للأسفل
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  // أضف Realtime listener للرسائل الجديدة في المحادثة:
  
    // جلب الرسائل
  const fetchMessages = async () => {
    if (!conversationId) return;

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("خطأ في جلب الرسائل:", error);
    } else {
      setMessages(data || []);
    }
  };
  

useEffect(() => {
scrollToBottom();	
}
)

useEffect(() => {
  if (!conversationId || !currentUser?.id) return;

  const supabase = createClient();

  // Realtime للرسائل الجديدة في هذه المحادثة
  const channel = supabase
    .channel(`conversation-${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      },
      async (payload) => {
        const newMessage = payload.new;
        
        // إذا كانت الرسالة من شخص آخر، حددها كمقروءة فوراً
        if (newMessage.sender_id !== currentUser.id) {
          await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('id', newMessage.id);
            
          // تصفير العداد
          await markConversationAsRead(conversationId, currentUser.id);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [conversationId, currentUser]);

// داخل useEffect عند تحميل المحادثة:
useEffect(() => {
  if (!conversationId || !currentUser?.id) return;

  const markAsRead = async () => {
    console.log('تحديد كمقروء:', conversationId, currentUser.id); // للتتبع
    const result = await markConversationAsRead(conversationId, currentUser.id);
    console.log('نتيجة التحديث:', result); // للتتبع
  };

  // تأخير صغير للتأكد من تحميل الرسائل
  const timer = setTimeout(markAsRead, 500);
  
  return () => clearTimeout(timer);
}, [conversationId, currentUser?.id]);

  // التحقق من المصادقة
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/main");
        return;
      }

      const { data: userProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setCurrentUser(userProfile || user);
    };

    checkAuth();
  }, [supabase, router]);

  // جلب تفاصيل المحادثة
  useEffect(() => {
    const fetchConversation = async () => {
      if (!currentUser || !conversationId) return;

      try {
        setLoading(true);

        // جلب المحادثة
        const { data: convData, error: convError } = await supabase
          .from("conversations")
          .select("*")
          .eq("id", conversationId)
          .single();

        if (convError) throw convError;

        // التحقق من أن المستخدم جزء من المحادثة
        if (convData.buyer_id !== currentUser.id && convData.seller_id !== currentUser.id) {
          throw new Error("غير مصرح لك بالوصول إلى هذه المحادثة");
        }

        setConversation(convData);

        // تحديد المستخدم الآخر
        const otherUserId = convData.buyer_id === currentUser.id 
          ? convData.seller_id 
          : convData.buyer_id;

        // جلب بيانات المستخدم الآخر
        const { data: otherUserData, error: otherUserError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", otherUserId)
          .single();

        if (otherUserError) {
          console.error("خطأ في جلب بيانات المستخدم:", otherUserError);
          setOtherUser({ id: otherUserId, full_name: "مستخدم" });
        } else {
          setOtherUser(otherUserData);
        }

        // جلب الرسائل
        await fetchMessages();

      } catch (err) {
        console.error("خطأ في جلب المحادثة:", err);
        alert(err.message || "حدث خطأ في تحميل المحادثة");
        router.push("/main");
      } finally {
        setLoading(false);
      }
    };

    fetchConversation();
  }, [currentUser, conversationId, supabase, router]);



  // الاشتراك في الرسائل الجديدة باستخدام Realtime
  useEffect(() => {
    if (!conversationId || !currentUser) return;

    // محاولة استخدام Realtime
    const setupRealtimeSubscription = async () => {
      try {
        // تنظيف القناة السابقة
        if (channelRef.current) {
          await supabase.removeChannel(channelRef.current);
        }

        // إنشاء قناة جديدة
        const channel = supabase
          .channel(`conversation_${conversationId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'messages',
              filter: `conversation_id=eq.${conversationId}`
            },
            (payload) => {
              console.log('رسالة جديدة:', payload);
              setMessages((prev) => {
                // تجنب التكرار
                if (prev.some(msg => msg.id === payload.new.id)) {
                  return prev;
                }
                return [...prev, payload.new];
              });
            }
          )
          .subscribe((status) => {
            console.log('حالة الاشتراك:', status);
            
            // إذا فشل الاتصال، استخدم Polling كبديل
            if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              console.warn('فشل Realtime، التحول إلى Polling');
              startPolling();
            }
          });

        channelRef.current = channel;
      } catch (error) {
        console.error('خطأ في إعداد Realtime:', error);
        startPolling();
      }
    };

    // بديل Polling إذا فشل Realtime
    const startPolling = () => {
      if (pollingInterval.current) return;
      
      pollingInterval.current = setInterval(async () => {
        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true });

        if (!error && data) {
          setMessages(data);
        }
      }, 3000); // كل 3 ثواني
    };

    setupRealtimeSubscription();

    // تنظيف عند إلغاء التحميل
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, [conversationId, currentUser, supabase]);

  // إرسال رسالة
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);

      const { error } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          sender_id: currentUser.id,
          content: newMessage.trim()
        });

      if (error) throw error;

      setNewMessage("");
      
      // إعادة جلب الرسائل للتأكد من التزامن
      setTimeout(() => {
        fetchMessages();
      }, 500);
      
    } catch (err) {
      console.error("خطأ في إرسال الرسالة:", err);
      alert("فشل إرسال الرسالة، حاول مرة أخرى");
    } finally {
      setSending(false);
    }
  };

  // تنسيق الوقت
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString("ar-SY", {
        hour: "2-digit",
        minute: "2-digit"
      });
    } else {
      return date.toLocaleDateString("ar-SY", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4 border-blue-500"></div>
            <p className="text-gray-600">جاري تحميل المحادثة...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex flex-col h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.back()}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-700" />
                </button>
                
                <Image
                  src={otherUser?.avatar_url || "/avatar.svg"}
                  alt={otherUser?.full_name || "مستخدم"}
                  width={40}
                  height={40}
                  className="rounded-full object-cover bg-gray-100"
                  priority
                  onError={(e) => { e.target.src = "/avatar.svg"; }}
                />
                
                <div>
                  <h2 className="font-semibold text-gray-900">
                    {otherUser?.full_name || "مستخدم"}
                  </h2>
                  <p className="text-xs text-gray-500">متصل الآن</p>
                </div>
              </div>

              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <MoreVertical className="w-5 h-5 text-gray-700" />
              </button>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 py-4">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">لا توجد رسائل بعد</p>
                <p className="text-sm text-gray-400 mt-2">ابدأ المحادثة الآن!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => {
                  const isOwn = message.sender_id === currentUser.id;
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                          isOwn
                            ? "bg-blue-500 text-white rounded-br-sm"
                            : "bg-white text-gray-900 rounded-bl-sm shadow-sm"
                        }`}
                      >
                        <p className="text-sm break-words">{message.content}</p>
                        <p
                          className={`text-xs mt-1 ${
                            isOwn ? "text-blue-100" : "text-gray-400"
                          }`}
                        >
                          {formatTime(message.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="bg-white border-t border-gray-200 sticky bottom-0 ">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="اكتب رسالة..."
                className="flex-1 px-4 py-3 bg-gray-100 rounded-full border-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className={`p-3 rounded-full transition-all ${
                  newMessage.trim() && !sending
                    ? "bg-blue-500 hover:bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}