"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Home,
  Search,
  Plus,
  Settings,
  ChevronDown,
  LogOut,
  PlusCircle,
  Heart,
  User,
} from "lucide-react";

export default function AppLayout({ children }) {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [searchInputValue, setSearchInputValue] = useState("");
  const [loading, setLoading] = useState(true);

  // التحقق من المصادقة
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user: authUser },
        error,
      } = await supabase.auth.getUser();

      if (error || !authUser) {
        router.push("/");
        return;
      }

      const { data: userProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single();

      setUser(userProfile || authUser);
      setLoading(false);
    };

    checkAuth();
  }, [supabase, router]);

  // إدارة النقر خارج القوائم
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserMenu && !event.target.closest(".user-menu-container")) {
        setShowUserMenu(false);
      }
      if (
        showSettingsMenu &&
        !event.target.closest(".settings-menu-container")
      ) {
        setShowSettingsMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showUserMenu, showSettingsMenu]);

  // دالة للتحقق من الصفحة النشطة
  const isActive = (path) => pathname === path;

  // شاشة التحميل
  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" ></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white" dir="rtl" lang="ar">
      {/* Desktop Sidebar */}
      <div className="hidden md:block fixed right-0 top-0 h-full w-20 bg-white border-l border-gray-200 z-50">
        <div className="flex flex-col items-center py-6 h-full">
          {/* Logo */}
          <button
            onClick={() => router.push("/main")}
            className="mb-8 text-white transition-colors"
          >
            <img
              src="/logo (6).jpeg"
              alt="شعار الموقع"
              className="w-11 h-11 rounded-xl object-cover"
            />
          </button>

          {/* Navigation Icons */}
          <div className="flex flex-col gap-4 mb-auto">
            <button
              onClick={() => router.push("/main")}
              className={`p-3 rounded-xl transition-colors ${
                isActive("/main")
                  ? "bg-gray-100 text-black"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
              title="الصفحة الرئيسية"
            >
              <Home className="w-6 h-6" />
            </button>

            <button
              onClick={() => router.push("/search")}
              className={`p-3 rounded-xl transition-colors ${
                isActive("/search")
                  ? "bg-gray-100 text-black"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
              title="البحث"
            >
              <Search className="w-6 h-6" />
            </button>

            <button
              onClick={() => router.push("/add-product")}
              className={`p-3 rounded-xl transition-colors ${
                isActive("/add-product")
                  ? "bg-gray-100 text-black"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
              title="إضافة منتج"
            >
              <Plus className="w-6 h-6" />
            </button>

            <button
              onClick={() => router.push("/favorites")}
              className={`p-3 rounded-xl transition-colors ${
                isActive("/favorites")
                  ? "bg-gray-100 text-black"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
              title="المفضلة"
            >
              <Heart className="w-6 h-6" />
            </button>
          </div>

          {/* Settings at bottom */}
          <div className="relative settings-menu-container">
            <button
              onClick={() => setShowSettingsMenu(!showSettingsMenu)}
              className="p-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              title="الإعدادات"
            >
              <Settings className="w-6 h-6" />
            </button>

            {/* قائمة الإعدادات المنبثقة */}
            {showSettingsMenu && (
              <div className="absolute ml-2 bottom-13 w-100 bg-white rounded-xl shadow-lg border py-2 z-50">
                <button
                  onClick={() => {
                    router.push("/settings");
                    setShowSettingsMenu(false);
                  }}
                  className="w-full px-4 py-3 text-right hover:bg-gray-50 transition-colors flex items-center gap-3"
                >
                  <Settings className="w-5 h-5 text-gray-500" />
                  <span>الإعدادات</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="md:mr-20">
        {/* Top Bar - Desktop */}
        <div className="hidden md:block sticky top-0 z-40 bg-white border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center gap-4">
              {/* Search Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (searchInputValue.trim()) {
                    router.push(
                      `/search?q=${encodeURIComponent(searchInputValue)}`
                    );
                  } else {
                    router.push("/search");
                  }
                }}
                className="flex-1 relative"
              >
                <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="ابحث في المنتجات..."
                  value={searchInputValue}
                  onChange={(e) => setSearchInputValue(e.target.value)}
                  className="w-full pr-12 pl-6 py-4 bg-gray-50 hover:bg-gray-100 focus:bg-white transition-colors rounded-2xl border-2 border-gray-200 focus:outline-none"
                />
              </form>

              {/* User Menu */}
              <div className="flex relative user-menu-container gap-1">
                <button
                  onClick={() => {
                    router.push("/dashboard");
                  }}
                >
                  <img
                    src={user.avatar_url || "/avatar.svg"}
                    alt="صورة المستخدم"
                    className="w-10 h-10 rounded-full border-2 border-gray-200 object-cover"
                    onError={(e) => {
                      e.target.src = "/avatar.svg";
                    }}
                  />
                </button>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-2 rounded-2xl hover:bg-gray-100 transition-colors"
                >
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                </button>

                {showUserMenu && (
                  <div className="absolute left-0 top-10 mt-2 w-48 bg-white rounded-xl shadow-lg border py-2 z-50">
                    <button
                      onClick={() => {
                        router.push("/dashboard");
                        setShowUserMenu(false);
                      }}
                      className="w-full px-4 py-3 text-right hover:bg-gray-50 transition-colors flex items-center gap-3"
                    >
                      <User className="w-5 h-5 text-gray-500" />
                      <span>الملف الشخصي</span>
                    </button>
                    <hr className="my-1" />
                    <button
                      onClick={async () => {
                        await supabase.auth.signOut();
                        router.push("/");
                      }}
                      className="w-full px-4 py-3 text-right hover:bg-gray-50 transition-colors flex items-center gap-3 text-red-600"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>تسجيل الخروج</span>
                    </button>
                  </div>
                )}
				
              </div>
			  
            </div>
          </div>
        </div>

        {/* Page Content */}
        {children}
      </div>

      {/* Mobile Bottom Navigation */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50"
        style={{ height: "70px" }}
      >
        <div className="flex items-center justify-around h-full">
          <button
            onClick={() => router.push("/main")}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
              isActive("/main") ? "" : "text-gray-600"
            }`}
            style={
              isActive("/main") ? { color: "white", background: "#3f47cc" } : {}
            }
          >
            <Home className="w-5 h-5" />
          </button>

          <button
            onClick={() => router.push("/search")}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
              isActive("/search") ? "" : "text-gray-600"
            }`}
            style={
              isActive("/search")
                ? { color: "white", background: "#3f47cc" }
                : {}
            }
          >
            <Search className="w-5 h-5" />
          </button>

          <button
            onClick={() => router.push("/add-product")}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg ${
              isActive("/add-product") ? "" : "text-gray-600"
            }`}
            style={
              isActive("/add-product")
                ? { color: "white", background: "#3f47cc" }
                : {}
            }
          >
            <PlusCircle className="w-5 h-5" />
          </button>

          <button
            onClick={() => router.push("/favorites")}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
              isActive("/favorites") ? "" : "text-gray-600"
            }`}
            style={
              isActive("/favorites")
                ? { color: "white", background: "#3f47cc" }
                : {}
            }
          >
            <Heart className="w-5 h-5" />
          </button>

          <button
            onClick={() => router.push("/dashboard")}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
              isActive("/dashboard") ? "" : "text-gray-600"
            }`}
            style={
              isActive("/dashboard")
                ? { color: "white", background: "#3f47cc", border: "1px solid #3f47cc" }
                : {}
            }
          >
            <User className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile Bottom Spacing */}
      <div className="md:hidden h-20"></div>
    </div>
  );
}
