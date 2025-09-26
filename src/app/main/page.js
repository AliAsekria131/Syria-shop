// main page
"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Home,
  Search,
  Plus,
  Filter,
  X,
  MapPin,
  Calendar,
  User,
  Settings,
  ChevronDown,
  PlusCircle,
  LogOut,
  MessageCircle,
  Menu,
} from "lucide-react";
import { getCurrentUser } from "../../utils/auth";
import { useExpiredAdsChecker } from "../../utils/checkExpiredAds";
import RemainingTime from "../components/RemainingTime";

export default function MainPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const pathname = usePathname();

  // الحالات
  const [user, setUser] = useState(null);
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const [searchInputValue, setSearchInputValue] = useState("");

  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  // 2. أضف مستمع النقر خارج قائمة الإعدادات (مع المستمعين الموجودين)
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

  // حالات الفلاتر
  const [filters, setFilters] = useState({
    category: "",
    location: "",
  });

  const [error, setError] = useState("");
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    useExpiredAdsChecker();
  }, []);

  // إضافة مستمع للنقر خارج القائمة المنسدلة
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserMenu && !event.target.closest(".user-menu-container")) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showUserMenu]);

  // التحقق من المصادقة
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
    };

    checkAuth();
  }, [supabase, router]);

  // دالة جلب البيانات مع الفلاتر
  const fetchAds = useCallback(
    async (showLoading = true) => {
      try {
        if (showLoading) setLoading(true);
        setError("");

        let query = supabase
          .from("ads")
          .select("*")
          .in("status", ["active", "expired"])
          .order("created_at", { ascending: false });

        // تطبيق الفلاتر
        if (filters.category) {
          query = query.eq("category", filters.category);
        }

        if (filters.location) {
          query = query.eq("location", filters.location);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) {
          throw new Error(fetchError.message);
        }

        if (data && data.length > 0) {
          const filteredData = data.filter((ad) => {
            return (
              ad.status === "active" ||
              (ad.status === "expired" && ad.user_id === user?.id)
            );
          });

          setAds(filteredData || []);
        } else {
          setAds([]);
        }
      } catch (err) {
        console.error("Error fetching ads:", err);
        setError("حدث خطأ في تحميل المنتجات");
      } finally {
        setLoading(false);
      }
    },
    [supabase, filters, user?.id]
  );

  // جلب الفئات والمواقع المتاحة
  const fetchFilters = useCallback(async () => {
    try {
      const { data: categoryData } = await supabase
        .from("ads")
        .select("category")
        .eq("status", "active");

      const uniqueCategories = [
        ...new Set(
          categoryData?.map((item) => item.category).filter(Boolean) || []
        ),
      ];
      setCategories(uniqueCategories);

      const { data: locationData } = await supabase
        .from("ads")
        .select("location")
        .eq("status", "active");

      const uniqueLocations = [
        ...new Set(
          locationData?.map((item) => item.location).filter(Boolean) || []
        ),
      ];
      setLocations(uniqueLocations);
    } catch (error) {
      console.error("Error fetching filters:", error);
    }
  }, [supabase]);

  useEffect(() => {
    if (user) {
      fetchAds(true);
      fetchFilters();
    }
  }, [user, fetchFilters]);

  // مراقبة تغيير الفلاتر
  useEffect(() => {
    if (user) {
      fetchAds(false);
    }
  }, [filters, user, fetchAds]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat("ar-SY").format(price);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ar-SY", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleImageError = (e) => {
    e.target.src = "/placeholder-image.jpg";
    e.target.alt = "صورة غير متاحة";
  };

  const clearFilters = () => {
    setFilters({
      category: "",
      location: "",
    });
  };

  const hasActiveFilters = () => {
    return filters.category || filters.location;
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحقق من المصادقة...</p>
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
              className={`p-3 rounded-xl transition-colors ${
                pathname === "/main"
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
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
        </div>

        {/* Products Grid */}
        <div className="p-4 md:p-6">
          {loading ? (
            <div className="text-center py-20">
              <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">جاري تحميل المنتجات...</p>
            </div>
          ) : ads.length === 0 ? (
            <div className="text-center py-20">
              <Search className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                {hasActiveFilters()
                  ? "لا توجد نتائج مطابقة"
                  : "لا توجد منتجات متاحة"}
              </h3>
              <p className="text-gray-500 mb-6">
                {hasActiveFilters()
                  ? "جرب تعديل معايير البحث أو مسح الفلاتر"
                  : "كن أول من يضيف منتجاً في هذا القسم"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 auto-rows-max">
              {ads.map((product) => (
                <div
                  key={product.id}
                  className="p-2 bg-white rounded-2xl overflow-hidden transition-all duration-200 cursor-pointer border border-gray-300 hover:shadow-md"
                  onClick={() => router.push(`/product/${product.id}`)}
                >
                  <div className="relative">
                    <div
                      className="relative w-full bg-gray-100 rounded-2xl flex items-center justify-center p-2"
                      style={{ aspectRatio: "1/1" }}
                    >
                      <img
                        src={
                          product.image_urls?.[0] || "/placeholder-image.jpg"
                        }
                        alt={product.title}
                        className="max-w-full max-h-full object-contain"
                        onError={handleImageError}
                        loading="lazy"
                      />
                    </div>
                    <div className="absolute top-3 right-3 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full">
                      {product.category}
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {product.title}
                    </h3>

                    <div className="mb-3">
                      <RemainingTime expiresAt={product.expires_at} />
                    </div>

                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg font-bold text-green-600">
                        {formatPrice(product.price)} {product.currency}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span>{product.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(product.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
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
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
              pathname === "/main" ? "text-red-500" : "text-gray-600"
            }`}
          >
            <Home className="w-5 h-5" />
          </button>

          <button
            onClick={() => router.push("/search")}
            className="flex flex-col items-center gap-1 p-2 rounded-lg transition-colors text-gray-600"
          >
            <Search className="w-5 h-5" />
          </button>

          <button
            onClick={() => router.push("/add-product")}
            className="flex flex-col items-center gap-1 p-2 rounded-lg text-red-500"
          >
            <PlusCircle className="w-5 h-5" />
          </button>

          <button
            onClick={() => router.push("/messages")}
            className="flex flex-col items-center gap-1 p-2 rounded-lg text-gray-600"
          >
            <MessageCircle className="w-5 h-5" />
          </button>

          <button
            onClick={() => router.push("/dashboard")}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
              pathname === "/dashboard" ? "text-red-500" : "text-gray-600"
            }`}
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
