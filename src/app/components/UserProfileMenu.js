// src/app/components/UserProfileMenu.js
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from 'next/image';
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

  // التحقق من وجود المستخدم
  if (!user) {
    return (
      <div className="w-9 h-9 rounded-full bg-gray-200 animate-pulse"></div>
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
          src={user?.avatar_url || "/avatar.svg"}
          alt="صورة المستخدم"
          width={36}
          height={36}
          className="rounded-full border-2 border-gray-200 object-cover w-9 h-9 hover:opacity-90 transition-opacity"
          priority
        />
      </button>
      
      <button
        onClick={() => setShowUserMenu(!showUserMenu)}
        className="flex items-center gap-1 p-1.5 rounded-xl hover:bg-gray-100 transition-colors focus:outline-none"
        aria-label="قائمة المستخدم"
        aria-expanded={showUserMenu}
      >
        <ChevronDown className="w-4 h-4 text-gray-600" />
      </button>
      
      {showUserMenu && (
        <div className="absolute left-0 top-11 w-44 bg-white rounded-xl shadow-lg border py-2 z-50 text-right">
          <button
            onClick={handleProfileClick}
            className="w-full px-4 py-2.5 text-right hover:bg-gray-50 transition-colors flex items-center gap-3 text-sm"
          >
            <User className="w-4 h-4 text-gray-500" />
            <span>الملف الشخصي</span>
          </button>
          
          <hr className="my-1 border-gray-200" />
          
          <button
            onClick={handleSignOutClick}
            className="w-full px-4 py-2.5 text-right hover:bg-gray-50 transition-colors flex items-center gap-3 text-red-600 font-medium text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      )}
    </div>
  );
}