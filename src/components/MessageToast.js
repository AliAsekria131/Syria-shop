// components/MessageToast.js
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { X } from 'lucide-react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export default function MessageToast({ currentUser }) {
  const router = useRouter();
  const supabase = createClient();
  const [notification, setNotification] = useState(null);
  const pathname = usePathname();

  useEffect(() => {
    if (!currentUser?.id) return;

    const channel = supabase
      .channel('new-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=neq.${currentUser.id}`
        },
        async (payload) => {
          const message = payload.new;
          
          const isInConversation = pathname === `/chat/${message.conversation_id}`;
          if (isInConversation) {
            return;
          }

          const { data: sender } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', message.sender_id)
            .single();

          const { data: conv } = await supabase
            .from('conversations')
            .select('buyer_id, seller_id')
            .eq('id', message.conversation_id)
            .single();

          if (conv && (conv.buyer_id === currentUser.id || conv.seller_id === currentUser.id)) {
            setNotification({
              id: message.id,
              conversationId: message.conversation_id,
              senderName: sender?.full_name || 'مستخدم',
              senderAvatar: sender?.avatar_url,
              content: message.content,
              timestamp: new Date()
            });

            setTimeout(() => {
              setNotification(null);
            }, 5000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, supabase, pathname]);

  if (!notification) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] animate-slide-down">
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700 p-4 min-w-[320px] max-w-md cursor-pointer hover:shadow-xl transition-shadow"
        onClick={() => {
          router.push(`/chat/${notification.conversationId}`);
          setNotification(null);
        }}
      >
        <div className="flex items-start gap-3">
          <Image
            src={notification.senderAvatar || '/avatar.svg'}
            alt={notification.senderName}
            width={40}
            height={40}
            className="rounded-full object-cover"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <p className="font-semibold text-gray-900 dark:text-white text-sm">
                {notification.senderName}
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setNotification(null);
                }}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
              {notification.content}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}