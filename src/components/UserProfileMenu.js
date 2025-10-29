"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ChevronDown, User, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export default function UserProfileMenu({ onSignOut }) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  // ======== جلب بيانات المستخدم مباشرة ========
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // جلب بيانات المصادقة
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        // جلب بيانات البروفايل من جدول profiles
        if (user) {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();
          setProfile(profileData);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();

    // الاستماع لتغييرات حالة المصادقة
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
        
        // تحديث البروفايل عند تغيير الجلسة
        if (session?.user) {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();
          setProfile(profileData);
        } else {
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // ======== إغلاق القائمة عند النقر خارجها ========
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showMenu]);

  // ======== معالجة الأزرار ========
  const handleNavigation = (path) => {
    setShowMenu(false);
    router.push(path);
  };

  const handleSignOut = () => {
    setShowMenu(false);
    onSignOut();
  };

  // ======== حالة التحميل ========
  if (loading || !user) {
    return (
      <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
    );
  }

  // الحصول على صورة المستخدم من البروفايل أو metadata
  const avatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url || "/avatar.svg";

  return (
    <div ref={menuRef} className="relative flex items-center gap-1">
      {/* صورة المستخدم */}
      <button
        onClick={() => handleNavigation("/dashboard")}
        className="focus:outline-none"
        aria-label="الملف الشخصي"
      >
        <Image
          src={avatarUrl}
          alt="صورة المستخدم"
          width={36}
          height={36}
          className="w-9 h-9 rounded-full border-2 border-gray-200 dark:border-gray-700 object-cover hover:opacity-90 transition-opacity"
          onError={(e) => {
            e.target.src = "/avatar.svg";
          }}
        />
      </button>

      {/* زر القائمة المنسدلة */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none"
        aria-label="قائمة المستخدم"
        aria-expanded={showMenu}
      >
        <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-300" />
      </button>

      {/* القائمة المنسدلة */}
      {showMenu && (
        <div className="absolute left-0 top-11 w-44 bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700 py-2 z-50">
          {/* الملف الشخصي */}
          <button
            onClick={() => handleNavigation("/dashboard")}
            className="w-full px-4 py-2.5 text-right hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-3 text-sm text-gray-900 dark:text-white"
          >
            <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span>الملف الشخصي</span>
          </button>

          <hr className="my-1 border-gray-200 dark:border-gray-700" />

          {/* تسجيل الخروج */}
          <button
            onClick={handleSignOut}
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