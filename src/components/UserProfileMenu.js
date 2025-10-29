// src/app/components/UserProfileMenu.js
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ChevronDown, User, LogOut } from "lucide-react";

export default function UserProfileMenu({ user, onSignOut }) {
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserMenu && !event.target.closest(".user-menu-container")) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showUserMenu]);

  const handleProfileClick = () => {
    router.push("/dashboard");
    setShowUserMenu(false);
  };

  const handleSignOutClick = () => {
    setShowUserMenu(false);
    onSignOut();
  };

  const [imgSrc, setImgSrc] = useState(user?.avatar_url || "/avatar.svg");
  const defaultAvatar = "/avatar.svg";

  const handleError = () => {
    if (imgSrc !== defaultAvatar) setImgSrc(defaultAvatar);
  };

  // التحقق من وجود المستخدم
  if (!user) {
    return (
      <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
    );
  }

  return (
    <div className="flex relative user-menu-container gap-1 items-center">
      <button
        onClick={() => router.push("/dashboard")}
        aria-label="الملف الشخصي"
        className="focus:outline-none"
      >
        <Image
          src={imgSrc}
          alt="صورة المستخدم"
          width={36}
          height={36}
          className="rounded-full border-2 border-gray-200 dark:border-gray-700 object-cover w-9 h-9 hover:opacity-90 transition-opacity"
          priority
          onError={handleError}
        />
      </button>

      <button
        onClick={() => setShowUserMenu(!showUserMenu)}
        className="flex items-center gap-1 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none"
        aria-label="قائمة المستخدم"
        aria-expanded={showUserMenu}
      >
        <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-300" />
      </button>

      {showUserMenu && (
        <div className="absolute left-0 top-11 w-44 bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700 py-2 z-50 text-right">
          <button
            onClick={handleProfileClick}
            className="w-full px-4 py-2.5 text-right hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-3 text-sm text-gray-900 dark:text-white"
          >
            <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span>الملف الشخصي</span>
          </button>

          <hr className="my-1 border-gray-200 dark:border-gray-700" />

          <button
            onClick={handleSignOutClick}
            className="w-full px-4 py-2.5 text-right hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-3 text-red-600 dark:text-red-400 font-medium text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      )}
    </div>
  );
}
