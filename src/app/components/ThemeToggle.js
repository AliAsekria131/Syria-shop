// src/app/components/ThemeToggle.js
"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from '../../contexts/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      // التغيير: bg-gray-100 -> bg-gray-100 dark:bg-gray-800
      // التغيير: dark:bg-gray-800 موجود مسبقاً، لذا تم توحيده مع القاعدة
      // التغيير: hover:bg-gray-200 -> hover:bg-gray-200 dark:hover:bg-gray-700
      // التغيير: dark:hover:bg-gray-700 موجود مسبقاً، لذا تم توحيده مع القاعدة
      className="p-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      aria-label="تبديل الوضع"
    >
      {theme === 'light' ? (
        // التغيير: text-gray-700 -> text-gray-700 dark:text-gray-200
        // التغيير: dark:text-gray-300 موجود مسبقاً، اخترت القاعدة (dark:text-gray-200) لـ gray-700
        // ملاحظة: احتفظت بـ dark:text-gray-300 لأنه كان موجوداً وأقرب لـ gray-700/light mode
        <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" /> 
      ) : (
        // اللون الملون (أصفر) احتفظ به كما هو
        <Sun className="w-5 h-5 text-yellow-500" />
      )}
    </button>
  );
}