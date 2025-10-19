// components/MessagesIcon.js
"use client";

import { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { getUnreadMessagesCount } from '@/utils/messages';

export default function MessagesIcon({ currentUser, isMobile = false }) {
  const router = useRouter();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const isActive = pathname?.startsWith('/chat');

  useEffect(() => {
    if (!currentUser?.id) return;

    const fetchCount = async () => {
      const result = await getUnreadMessagesCount(currentUser.id);
      if (result.success) {
        setUnreadCount(result.count);
      }
    };

    fetchCount();
    
    const interval = setInterval(fetchCount, 10000);
    return () => clearInterval(interval);
  }, [currentUser]);

  if (isMobile) {
    if (pathname?.startsWith('/chat')) {
      return null;
    }
    return (
      <button
        onClick={() => router.push('/chat')}
        className="fixed bottom-24 left-4 z-50 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg dark:shadow-gray-900/50 flex items-center justify-center hover:bg-blue-700 transition-all active:scale-95"
        aria-label="الرسائل"
      >
        <MessageCircle className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={() => router.push('/chat')}
      className="fixed bottom-10 left-4 z-50 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg dark:shadow-gray-900/50 flex items-center justify-center hover:bg-blue-700 transition-all active:scale-95"
      aria-label="الرسائل"
    >
      <MessageCircle className="w-6 h-6" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
}