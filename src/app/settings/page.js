// settings page
"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Home,
  Plus,
  MessageCircle,
  Settings,
  User,
  ChevronDown,
  LogOut,
  Edit3,
  ArrowRight,
  Search,
  Filter,
} from "lucide-react";
import { getCurrentUser } from "../../utils/auth";
import ProfileEditForm from "../components/ProfileEditForm";

export default function SettingsPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  // الحالات
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);

  const [showDesktopFilters, setShowDesktopFilters] = useState(false);
  const [searchInputValue, setSearchInputValue] = useState("");

  // مستمع النقر خارج القوائم المنسدلة
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

  // التحقق من المصادقة وجلب بيانات المستخدم
  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await getCurrentUser(supabase);
      if (!currentUser) {
        router.push("/");
        return;
      }

      const { data: userProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();

      setUser(userProfile || currentUser);
      setLoading(false);
    };

    checkAuth();
  }, [supabase, router]);

  const handleProfileUpdate = (updatedProfile) => {
    setUser(updatedProfile);
    setShowProfileEdit(false);
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
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
            className="mb-8 p-3 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors"
          >
            <Home className="w-6 h-6" />
          </button>

          {/* Navigation Icons */}
          <div className="flex flex-col gap-4 mb-auto">
            <button
              onClick={() => router.push("/main")}
              className="p-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              title="الصفحة الرئيسية"
            >
              <Home className="w-6 h-6" />
            </button>

            <button
              onClick={() => router.push("/search")}
              className="p-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              title="البحث"
            >
              <Search className="w-6 h-6" />
            </button>

            <button
              onClick={() => router.push("/add-product")}
              className="p-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              title="إضافة منتج"
            >
              <Plus className="w-6 h-6" />
            </button>

            <button
              onClick={() => router.push("/messages")}
              className="p-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              title="الرسائل"
            >
              <MessageCircle className="w-6 h-6" />
            </button>
          </div>

          {/* Settings at bottom */}
          <div className="relative settings-menu-container">
            <button
              onClick={() => setShowSettingsMenu(!showSettingsMenu)}
              className="p-3 bg-gray-900 text-white rounded-xl transition-colors"
              title="الإعدادات"
            >
              <Settings className="w-6 h-6" />
            </button>

            {/* قائمة الإعدادات المنبثقة */}
            {showSettingsMenu && (
              <div className="absolute left-full ml-2 bottom-0 w-48 bg-white rounded-xl shadow-lg border py-2 z-50">
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
              <button
                onClick={() => setShowDesktopFilters(!showDesktopFilters)}
                className={`p-3 rounded-xl transition-colors ${
                  showDesktopFilters
                    ? "bg-gray-900 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
                title="الفلاتر"
              >
                <Filter className="w-6 h-6" />
              </button>

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
                  className="w-full pr-12 pl-6 py-4 bg-gray-50 hover:bg-gray-100 focus:bg-white transition-colors rounded-full border-2 border-gray-200 hover:border-red-300 focus:border-red-500 focus:outline-none"
                />
              </form>

              {/* User Menu */}
              <div className="relative user-menu-container">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <img
                    src={user.avatar_url || "/avatar.svg"}
                    alt="صورة المستخدم"
                    className="w-10 h-10 rounded-full border-2 border-gray-200 object-cover"
                    onError={(e) => {
                      e.target.src = "/avatar.svg";
                    }}
                  />
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                </button>

                {showUserMenu && (
                  <div className="absolute left-0 mt-2 w-48 bg-white rounded-xl shadow-lg border py-2 z-50">
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

          {/* Desktop Filters Panel */}
          {showDesktopFilters && (
            <div className="px-6 pb-4 border-b border-gray-200">
              <div className="flex items-center gap-4">
                <select
                  value={filters.category}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                  className="px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:border-red-500"
                >
                  <option value="">جميع الفئات</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>

                <select
                  value={filters.location}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      location: e.target.value,
                    }))
                  }
                  className="px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:border-red-500"
                >
                  <option value="">جميع المواقع</option>
                  {locations.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>

                {hasActiveFilters() && (
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 text-red-500 hover:text-red-600 font-medium"
                  >
                    مسح الفلاتر
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Settings Content */}
        <div className="p-6 max-w-4xl mx-auto">
          {!showProfileEdit ? (
            <>
              {/* Profile Section */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
                <div className="flex items-center gap-4 mb-6">
                  <img
                    src={user.avatar_url || "/avatar.svg"}
                    alt="صورة المستخدم"
                    className="w-16 h-16 rounded-full border-4 object-cover"
                    style={{ borderColor: "#1877F2" }}
                    onError={(e) => {
                      e.target.src = "/avatar.svg";
                    }}
                  />
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">
                      {user.full_name || "المستخدم"}
                    </h2>
                    <p className="text-gray-600">{user.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-700 mb-1">
                      رقم الهاتف
                    </h3>
                    <p className="text-gray-900">{user.phone || "غير محدد"}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-700 mb-1">
                      الموقع
                    </h3>
                    <p className="text-gray-900">
                      {user.location || "غير محدد"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Settings Options */}
              <div className="bg-white rounded-2xl border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-800">
                    إعدادات الحساب
                  </h2>
                </div>

                <div className="p-6">
                  <button
                    onClick={() => setShowProfileEdit(true)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors border border-gray-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Edit3 className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="text-right">
                        <h3 className="font-semibold text-gray-900">
                          تحرير الملف الشخصي
                        </h3>
                        <p className="text-sm text-gray-600">
                          قم بتحديث معلوماتك الشخصية
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 rotate-180" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200">
              <ProfileEditForm
                user={user}
                onClose={() => setShowProfileEdit(false)}
                onUpdate={handleProfileUpdate}
                supabase={supabase}
              />
            </div>
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50"
        style={{ height: "70px" }}
      >
        <div className="flex items-center justify-around h-full">
          <button
            onClick={() => router.push("/main")}
            className="flex flex-col items-center gap-1 p-2 rounded-lg text-gray-600"
          >
            <Home className="w-5 h-5" />
          </button>

          <button
            onClick={() => router.push("/add-product")}
            className="flex flex-col items-center gap-1 p-2 rounded-lg text-gray-600"
          >
            <Plus className="w-5 h-5" />
          </button>

          <button
            onClick={() => router.push("/messages")}
            className="flex flex-col items-center gap-1 p-2 rounded-lg text-gray-600"
          >
            <MessageCircle className="w-5 h-5" />
          </button>

          <button
            onClick={() => router.push("/dashboard")}
            className="flex flex-col items-center gap-1 p-2 rounded-lg text-gray-600"
          >
            <User className="w-5 h-5" />
          </button>

          <button className="flex flex-col items-center gap-1 p-2 rounded-lg text-red-500">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile Bottom Spacing */}
      <div className="md:hidden h-20"></div>
    </div>
  );
}
