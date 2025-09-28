"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getCurrentUser } from "../../utils/auth";
import {
  Home,
  User,
  Plus,
  ChevronDown,
  LogOut,
  Settings,
  Heart,
  MessageCircle,
  PlusCircle,
  Search,
  MapPin,
  Calendar,
  Trash2,
  HeartOff,
  ArrowLeft,
} from "lucide-react";

import { getUserLikedProducts, removeLike } from "../../utils/likes";

export default function FavoritesPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const pathname = usePathname();

  // الحالات
  const [currentUser, setCurrentUser] = useState(null);
  const [likedProducts, setLikedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [removingLike, setRemovingLike] = useState(null);

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
      const user = await getCurrentUser(supabase);
      if (!user) {
        router.push("/main");
        return;
      }

      // جلب بيانات الملف الشخصي
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setCurrentUser(userProfile || user);
    };

    checkAuth();
  }, [supabase, router]);

  // جلب المنتجات المُعجب بها
  useEffect(() => {
    const fetchLikedProducts = async () => {
      if (!currentUser) return;

      try {
        setLoading(true);
        setError("");

        const result = await getUserLikedProducts(currentUser.id, 50);

        if (result.success) {
          setLikedProducts(result.data);
        } else {
          setError(result.error || "حدث خطأ في جلب المنتجات المُعجب بها");
        }
      } catch (err) {
        console.error("Error fetching liked products:", err);
        setError("حدث خطأ في تحميل البيانات");
      } finally {
        setLoading(false);
      }
    };

    fetchLikedProducts();
  }, [currentUser]);

  // دالة إزالة الإعجاب
  const handleRemoveLike = async (productId, likeId) => {
    if (!confirm("هل تريد إزالة هذا المنتج من المفضلة؟")) {
      return;
    }

    try {
      setRemovingLike(productId);

      const result = await removeLike(currentUser.id, productId);

      if (result.success) {
        // إزالة المنتج من القائمة
        setLikedProducts((prev) =>
          prev.filter((item) => item.ads.id !== productId)
        );
      } else {
        alert("حدث خطأ في إزالة الإعجاب");
      }
    } catch (error) {
      console.error("Error removing like:", error);
      alert("حدث خطأ، يرجى المحاولة مرة أخرى");
    } finally {
      setRemovingLike(null);
    }
  };

  // دالة تنسيق السعر
  const formatPrice = (price) => {
    return new Intl.NumberFormat("ar-SY").format(price);
  };

  // دالة تنسيق التاريخ
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ar-SY", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // دالة معالجة خطأ الصورة
  const handleImageError = (e) => {
    if (e.target.src.includes("/placeholder-image.jpg")) {
      return;
    }
    e.target.style.display = "block";
    e.target.style.minHeight = "192px";
    e.target.style.backgroundColor = "#f3f4f6";
    e.target.src = "/placeholder-image.jpg";
    e.target.alt = "صورة غير متاحة";
  };

  // شاشة التحميل
  if (loading) {
    return (
      <div className="min-h-screen bg-white" dir="rtl" lang="ar">
        <div className="hidden md:block fixed right-0 top-0 h-full w-20 bg-white border-l border-gray-200 z-50"></div>
        <div className="md:mr-20">
          <div className="flex items-center justify-center pt-20">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">جاري تحميل المفضلة...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white" dir="rtl" lang="ar">
      {/* Desktop Sidebar */}
      <div className="hidden md:block fixed right-0 top-0 h-full w-20 bg-white border-l border-gray-200 z-50">
        <div className="flex flex-col items-center py-6 h-full">
          <button
            onClick={() => router.push("/main")}
            className="mb-8 p-3 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors"
          >
            <Home className="w-6 h-6" />
          </button>

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
              onClick={() => router.push("/favorites")}
              className="p-3 bg-gray-900 text-white rounded-xl transition-colors"
              title="المفضلة"
            >
              <Heart className="w-6 h-6" />
            </button>
          </div>

          <button
            onClick={() => router.push("/settings")}
            className="p-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            title="الإعدادات"
          >
            <Settings className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="md:mr-20">
        {/* Top Bar - Desktop */}
        <div className="hidden md:block sticky top-0 z-40 bg-white border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center gap-4">
              {/* Search Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const searchValue = e.target.search.value.trim();
                  if (searchValue) {
                    router.push(`/search?q=${encodeURIComponent(searchValue)}`);
                  } else {
                    router.push("/search");
                  }
                }}
                className="flex-1 relative"
              >
                <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  name="search"
                  placeholder="ابحث في المنتجات..."
                  className="w-full pr-12 pl-12 py-4 rounded-full border-2 border-gray-200 focus:border-red-500 focus:outline-none text-lg"
                />
              </form>

              {/* User Menu */}
              <div className="relative user-menu-container">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <img
                    src={currentUser.avatar_url || "/avatar.svg"}
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

        {/* Content */}
        <div className="p-4 md:p-6">
          {/* Mobile Title */}
          <div className="md:hidden mb-6">
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-bold text-gray-900">المفضلة</h1>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">❌</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">خطأ</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                إعادة المحاولة
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && likedProducts.length === 0 && (
            <div className="text-center py-20">
              <HeartOff className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                لا توجد منتجات مفضلة
              </h2>
              <p className="text-gray-600 mb-6">
                لم تقم بإضافة أي منتجات إلى المفضلة بعد
              </p>
              <button
                onClick={() => router.push("/main")}
                className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                تصفح المنتجات
              </button>
            </div>
          )}

          {/* Products Grid */}
          {!loading && !error && likedProducts.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {likedProducts.map((likeItem) => {
                const product = likeItem.ads;
                return (
                  <div
                    key={likeItem.id}
                    className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200 border border-gray-100 group relative"
                  >
                    {/* Remove Like Button */}
                    <button
                      onClick={() => handleRemoveLike(product.id, likeItem.id)}
                      disabled={removingLike === product.id}
                      className={`absolute top-3 left-3 z-10 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all opacity-0 group-hover:opacity-100 ${
                        removingLike === product.id
                          ? "bg-gray-300"
                          : "bg-white hover:bg-red-50"
                      }`}
                    >
                      {removingLike === product.id ? (
                        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Trash2 className="w-4 h-4 text-red-500" />
                      )}
                    </button>

                    {/* Product Image */}
                    <div
                      className="relative w-full bg-gray-100 cursor-pointer"
                      style={{ aspectRatio: "4/3" }}
                      onClick={() => router.push(`/product/${product.id}`)}
                    >
                      <img
                        src={
                          product.image_urls?.[0] || "/placeholder-image.jpg"
                        }
                        alt={product.title}
                        className="w-full h-full object-cover"
                        onError={handleImageError}
                        loading="lazy"
                      />
                    </div>

                    {/* Product Info */}
                    <div
                      className="p-4 cursor-pointer"
                      onClick={() => router.push(`/product/${product.id}`)}
                    >
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                        {product.title}
                      </h3>

                      <div className="text-lg font-bold text-green-600 mb-2">
                        {formatPrice(product.price)} {product.currency}
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                        <MapPin className="w-4 h-4" />
                        <span>{product.location}</span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(likeItem.created_at)}</span>
                        </div>
                        <span className="px-2 py-1 bg-gray-100 rounded-full">
                          {product.category}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
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
            onClick={() => router.push("/search")}
            className="flex flex-col items-center gap-1 p-2 rounded-lg text-gray-600"
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
            onClick={() => router.push("/favorites")}
            className="flex flex-col items-center gap-1 p-2 rounded-lg text-red-500"
          >
            <Heart className="w-5 h-5 fill-current" />
          </button>

          <button
            onClick={() => router.push("/dashboard")}
            className="flex flex-col items-center gap-1 p-2 rounded-lg text-gray-600"
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
