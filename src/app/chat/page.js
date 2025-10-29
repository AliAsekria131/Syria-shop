// chat/page.js
"use client";

import { createClient } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { MessageCircle } from "lucide-react";
import AvatarWithFallback from "./AvatarWithFallback";

import AppLayout from "@/components/AppLayout";

export default function ChatListPage() {
  const supabase = createClient();
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

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

  useEffect(() => {
    const fetchConversations = async () => {
      if (!currentUser) return;

      try {
        setLoading(true);

        // جلب المحادثات
        const { data: convData, error: convError } = await supabase
          .from("conversations")
          .select("*")
          .or(`buyer_id.eq.${currentUser.id},seller_id.eq.${currentUser.id}`)
          .order("created_at", { ascending: false });

        if (convError) throw convError;

        // جلب آخر رسالة لكل محادثة
        const conversationsWithDetails = await Promise.all(
          (convData || []).map(async (conv) => {
            const otherUserId =
              conv.buyer_id === currentUser.id ? conv.seller_id : conv.buyer_id;

            // جلب بيانات المستخدم الآخر
            const { data: otherUser } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", otherUserId)
              .single();

            // جلب آخر رسالة
            const { data: lastMessage } = await supabase
              .from("messages")
              .select("*")
              .eq("conversation_id", conv.id)
              .order("created_at", { ascending: false })
              .limit(1)
              .single();

            return {
              ...conv,
              otherUser: otherUser || { id: otherUserId, full_name: "مستخدم" },
              lastMessage: lastMessage || null,
            };
          }),
        );

        setConversations(conversationsWithDetails);
      } catch (err) {
        console.error("خطأ في جلب المحادثات:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [currentUser, supabase]);

  const formatTime = (dateString) => {
    if (!dateString) return "";

    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString("ar-SY", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffInHours < 48) {
      return "أمس";
    } else {
      return date.toLocaleDateString("ar-SY", {
        month: "short",
        day: "numeric",
      });
    }
  };


  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center pt-20">
          <div className="text-center">
            {/* border-blue-500 لا يتغير */}
            <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4 border-blue-500"></div>
            {/* text-gray-600 -> dark:text-gray-300 */}
            <p className="text-gray-600 dark:text-gray-300">
              جاري تحميل المحادثات...
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-4">
        <div className="mb-6">
          {/* text-gray-900 -> dark:text-white */}
          {/* border-gray-200 -> dark:border-gray-700 */}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white pb-3 border-b-2 border-gray-200 dark:border-gray-700">
            المحادثات
          </h1>
        </div>

        {conversations.length === 0 ? (
          <div className="text-center py-12">
            {/* text-gray-300 لا يتغير (لون فاتح) */}
            <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            {/* text-gray-500 -> dark:text-gray-400 */}
            <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">
              لا توجد محادثات بعد
            </p>
            {/* text-gray-400 لا يتغير (لون فاتح) */}
            <p className="text-gray-400 text-sm">
              ابدأ محادثة جديدة من خلال التواصل مع البائعين
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => router.push(`/chat/${conv.id}`)}
                // bg-white -> dark:bg-gray-900
                // border-gray-200 -> dark:border-gray-700
                // hover:shadow-md -> dark:hover:shadow-gray-900/30 (تطبيق قاعدة الظلال)
                className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md dark:hover:shadow-gray-900/30 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <AvatarWithFallback
                    user={conv.otherUser}
                    width={36}
                    height={36}
                    className="rounded-full border-2 border-gray-200 dark:border-gray-700 object-cover w-9 h-9 hover:opacity-90 transition-opacity"
                  />

                  {/* النقطة الحمراء */}
                  {((currentUser.id === conv.buyer_id &&
                    conv.unread_count_buyer > 0) ||
                    (currentUser.id === conv.seller_id &&
                      conv.unread_count_seller > 0)) && (
                    // border-white -> dark:border-gray-900 (لتتناسب مع خلفية البطاقة الداكنة)
                    <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-white dark:border-gray-900"></span>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      {/* text-gray-900 -> dark:text-white */}
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {conv.otherUser?.full_name || "مستخدم"}
                      </h3>
                      {/* text-gray-500 -> dark:text-gray-400 */}
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatTime(
                          conv.lastMessage?.created_at || conv.created_at,
                        )}
                      </span>
                    </div>
                    {/* text-gray-600 -> dark:text-gray-300 */}
                    <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                      {conv.lastMessage?.content || "لا توجد رسائل بعد"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
