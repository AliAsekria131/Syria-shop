// components/RemainingTime.js
'use client';
import { useState, useEffect } from 'react';
import {
  Clock,
} from "lucide-react";


export default function RemainingTime({ expiresAt }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const difference = expiry - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));

        if (days > 0) {
          setTimeLeft(`${days} يوم و ${hours} ساعة`);
        } else if (hours > 0) {
          setTimeLeft(`${hours} ساعة و ${minutes} دقيقة`);
        } else {
          setTimeLeft(`${minutes} دقيقة`);
        }
        setIsExpired(false);
      } else {
        setTimeLeft('الاعلان منتهي الصلاحية سيتم حذفة في نهاية اليوم.');
        setIsExpired(true);
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 60000); // تحديث كل دقيقة

    return () => clearInterval(interval);
  }, [expiresAt]);

  return (
    // التغيير: text-gray-500 -> text-gray-500 dark:text-gray-400
    // اللون الأحمر (text-red-500) احتفظ به كما هو
    <div className={`text-sm ${isExpired ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
      <Clock className="inline-block ml-1 mb-1 w-4 h-4" />
      {timeLeft}
    </div>
  );
}