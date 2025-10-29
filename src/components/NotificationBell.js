// components/NotificationBell.js
"use client";

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { 
  getUnreadNotificationsCount, 
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
} from '@/utils/notifications';

export default function NotificationBell({ currentUser }) {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    const fetchCount = async () => {
      const result = await getUnreadNotificationsCount(currentUser.id);
      if (result.success) {
        setUnreadCount(result.count);
      }
    };

    fetchCount();
    
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const handleToggle = async () => {
    if (!showDropdown) {
      setLoading(true);
      const result = await getNotifications(currentUser.id);
      if (result.success) {
        setNotifications(result.data);
      }
      setLoading(false);
    }
    setShowDropdown(!showDropdown);
  };

  const handleNotificationClick = async (notification) => {
    await markNotificationAsRead(notification.id);
    setUnreadCount(prev => Math.max(0, prev - 1));
    setShowDropdown(false);
    
    if (notification.conversation_id) {
      router.push(`/chat/${notification.conversation_id}`);
    }
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead(currentUser.id);
    setUnreadCount(0);
    setNotifications(notifications.map(n => ({ ...n, is_read: true })));
  };

  const formatTime = (date) => {
    const now = new Date();
    const created = new Date(date);
    const diffMs = now - created;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffMins < 1440) return `منذ ${Math.floor(diffMins / 60)} ساعة`;
    return `منذ ${Math.floor(diffMins / 1440)} يوم`;
  };

  return (
    <div className="relative">
      <button
        onClick={handleToggle}
        className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <Bell className="w-6 h-6 text-gray-700 dark:text-gray-200" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-hidden">
            <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="font-bold text-gray-900 dark:text-white">الإشعارات</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  تحديد الكل كمقروء
                </button>
              )}
            </div>

            <div className="overflow-y-auto max-h-80">
              {loading ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  جاري التحميل...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  لا توجد إشعارات
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-3 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      !notification.is_read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold text-sm text-gray-900 dark:text-white">
                        {notification.title}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatTime(notification.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                      {notification.message}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}