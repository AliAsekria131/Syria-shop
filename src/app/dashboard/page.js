// dashboard
"use client";
import React from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";

import { getCurrentUser } from "../../utils/auth";
import EditProductForm from "../components/EditProductForm";
import { validateProduct, cleanText, parsePrice } from "../../utils/validation";
import {
  Home,
  Search,
  PlusCircle,
  Settings,
  User,
  Package,
  Eye,
  MapPin,
  Calendar,
  Edit3,
  Trash2,
  Plus,
  ChevronDown,
  LogOut,
  MessageCircle,
  Grid,
  List,
  X,
} from "lucide-react";

export default function Dashboard() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const pathname = usePathname();

  // الحالات
  const [user, setUser] = useState(null);
  const [myAds, setMyAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    views: 0,
  });
  const [error, setError] = useState("");
  const [editProductOpen, setEditProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [viewMode, setViewMode] = useState("grid");
  const [showUserMenu, setShowUserMenu] = useState(false);


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

  // التحقق من المصادقة وجلب الملف الشخصي
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser(supabase);
        if (!currentUser) {
          router.push("/");
          return;
        }

        const { data: existingProfile, error: fetchError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", currentUser.id)
          .maybeSingle();

        if (fetchError && fetchError.code !== "PGRST116") {
          console.error("Profile fetch error:", fetchError);
          setUser({
            id: currentUser.id,
            email: currentUser.email,
            full_name: currentUser.user_metadata?.full_name || "",
            phone: currentUser.user_metadata?.phone || "",
            location: "",
            avatar_url: "",
          });
          return;
        }

        if (existingProfile) {
          setUser(existingProfile);
          return;
        }

        const newProfileData = {
          id: currentUser.id,
          email: currentUser.email,
          full_name: currentUser.user_metadata?.full_name || "",
          phone: currentUser.user_metadata?.phone || "",
          location: "",
          avatar_url: "",
        };

        const { data: newProfile, error: createError } = await supabase
          .from("profiles")
          .insert([newProfileData])
          .select()
          .single();

        if (createError) {
          console.error("Error creating profile:", createError);
          setUser(newProfileData);
        } else {
          setUser(newProfile);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        router.push("/");
      }
    };
    checkAuth();
  }, [supabase, router]);

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

  // دالة جلب منتجات المستخدم
  const fetchMyAds = useCallback(
    async (showLoading = true) => {
      if (!user) return;
      try {
        if (showLoading) setLoading(true);
        setError("");
        const { data, error: fetchError } = await supabase
          .from("ads")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        if (fetchError) {
          throw new Error(fetchError.message);
        }
        setMyAds(data || []);
        const totalAds = data?.length || 0;
        const activeAds =
          data?.filter((ad) => ad.status === "active").length || 0;
        setStats({
          total: totalAds,
          active: activeAds,
          views: totalAds * 12,
        });
      } catch (err) {
        console.error("Error fetching my ads:", err);
        setError("حدث خطأ في تحميل منتجاتك");
      } finally {
        setLoading(false);
      }
    },
    [supabase, user]
  );

  useEffect(() => {
    if (user) {
      fetchMyAds(true);
    }
  }, [user, fetchMyAds]);

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا المنتج؟")) {
      return;
    }
    try {
      const { error } = await supabase
        .from("ads")
        .delete()
        .eq("id", productId)
        .eq("user_id", user.id);

      if (error) {
        throw new Error(error.message);
      }

      setMyAds((prev) => prev.filter((ad) => ad.id !== productId));
      setStats((prev) => ({
        total: prev.total - 1,
        active: prev.active - 1,
        views: prev.views,
      }));
      showSuccessMessage("تم حذف المنتج بنجاح");
    } catch (err) {
      console.error("Error deleting product:", err);
      alert("حدث خطأ في حذف المنتج");
    }
  };

  const handleProductUpdated = (updatedProduct) => {
    setMyAds((prevAds) =>
      prevAds.map((ad) => (ad.id === updatedProduct.id ? updatedProduct : ad))
    );
    showSuccessMessage("تم تحديث المنتج بنجاح!");
    setEditProductOpen(false);
    setEditingProduct(null);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setEditProductOpen(true);
  };

  const showSuccessMessage = (message) => {
    const successDiv = document.createElement("div");
    successDiv.className =
      "fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform translate-x-full";
    successDiv.textContent = message;
    document.body.appendChild(successDiv);

    setTimeout(() => {
      successDiv.style.transform = "translateX(0)";
      successDiv.style.transition = "transform 0.3s ease-out";
    }, 100);

    setTimeout(() => {
      successDiv.style.transform = "translateX(full)";
      setTimeout(() => {
        if (document.body.contains(successDiv)) {
          document.body.removeChild(successDiv);
        }
      }, 300);
    }, 3000);
  };

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
      {editProductOpen && editingProduct && (
        <EditProductForm
          product={editingProduct}
          onClose={() => {
            setEditProductOpen(false);
            setEditingProduct(null);
          }}
          onProductUpdated={handleProductUpdated}
          supabase={supabase}
        />
      )}

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

        {/* Mobile Header */}
        <div className="flex items-center justify-between relative md:hidden sticky top-0 z-40 bg-white border-b border-gray-200 p-4">
          <h1 className="text-xl font-bold text-center">لوحة التحكم</h1>


            <button
              onClick={() => setShowSettingsMenu(!showSettingsMenu)}
              className="p-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              title="الإعدادات"
            >
              <Settings className="w-6 h-6" />
            </button>

          {/* Settings at bottom */}
            {showSettingsMenu && (
              <div className="absolute settings-menu-container ml-2 top-0 left-0 h-150 w-full bg-white rounded-xl shadow-lg py-2 z-50">
                <button 
                  onClick={() => {
                    setShowSettingsMenu(false);
                  }}
                  >
                  <X className="w-8 h-8 text-gray-600 float-left mr-6 mt-5" />  
                  </button>
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

        {/* Content */}
        <div className="p-4 md:p-6 max-w-6xl mx-auto">
          {/* User Info Card */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-200">
            <div className="flex items-center gap-4">
              <img
                src={user.avatar_url || "/avatar.svg"}
                alt="صورة المستخدم"
                className="w-16 h-16 rounded-full border-2 border-red-500 object-cover"
                onError={(e) => {
                  e.target.src = "/avatar.svg";
                }}
              />
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-gray-900 truncate">
                  {user.full_name || "مستخدم جديد"}
                </h2>
                <div className="flex flex-wrap gap-3 mt-1 text-sm text-gray-600">
                  <span>{user.email}</span>
                  {user.phone && <span>• {user.phone}</span>}
                  {user.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {user.location}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Profile Completion Alert */}
          {(!user.avatar_url || !user.location) && (
            <div className="bg-yellow-50 rounded-xl shadow-sm p-4 mb-6 border border-yellow-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center">
                  <Info className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-800">
                    ملفك الشخصي غير مكتمل
                  </div>
                  <div className="text-sm text-gray-600">
                    أكمل بياناتك للحصول على تجربة أفضل
                  </div>
                </div>
                <button
                  onClick={() => router.push("/profile/edit")}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors font-medium"
                >
                  أكمل الملف الشخصي
                </button>
              </div>
            </div>
          )}

          {/* Statistics */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200 text-center">
              <div className="w-8 h-8 rounded-lg mx-auto mb-2 bg-blue-100 flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              <p className="text-sm text-gray-600">إجمالي المنتجات</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200 text-center">
              <div className="w-8 h-8 rounded-lg mx-auto mb-2 bg-green-100 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-green-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {stats.active}
              </p>
              <p className="text-sm text-gray-600">منتجات نشطة</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200 text-center">
              <div className="w-8 h-8 rounded-lg mx-auto mb-2 bg-purple-100 flex items-center justify-center">
                <Eye className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-purple-600">
                {stats.views}
              </p>
              <p className="text-sm text-gray-600">المشاهدات</p>
            </div>
          </div>

          {/* Products Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    منتجاتي ({myAds.length})
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    إدارة وتعديل منتجاتك المنشورة
                  </p>
                </div>

                {/* View Mode Toggle */}
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === "grid"
                        ? "bg-white shadow-sm text-red-500"
                        : "text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === "list"
                        ? "bg-white shadow-sm text-red-500"
                        : "text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">جاري تحميل منتجاتك...</p>
                </div>
              ) : myAds.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full mx-auto mb-4 bg-gray-100 flex items-center justify-center">
                    <Package className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    لا توجد منتجات بعد
                  </h3>
                  <p className="text-gray-500 mb-6">
                    ابدأ ببيع منتجاتك الآن وزد دخلك!
                  </p>
                  <button
                    onClick={() => router.push("/add-product")}
                    className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors font-medium"
                  >
                    <Plus className="w-4 h-4 inline ml-2" />
                    أضف أول منتج
                  </button>
                </div>
              ) : (
                <>
                  {viewMode === "grid" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {myAds.map((product) => (
                        <div
                          key={product.id}
                          className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200"
                        >
                          <div className="relative">
                            <div
                              className="relative w-full bg-gray-100 flex items-center justify-center p-2"
                              style={{ aspectRatio: "1/1" }}
                            >
                              <img
                                src={
                                  product.image_urls?.[0] ||
                                  "/placeholder-image.jpg"
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
                            <div
                              className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium ${
                                product.status === "active"
                                  ? "bg-green-500 text-white"
                                  : "bg-red-500 text-white"
                              }`}
                            >
                              {product.status === "active" ? "نشط" : "غير نشط"}
                            </div>
                          </div>

                          <div className="p-4">
                            <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                              {product.title}
                            </h3>

                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                              {product.description}
                            </p>

                            <div className="flex items-center justify-between mb-3">
                              <span className="text-lg font-bold text-green-600">
                                {formatPrice(product.price)} {product.currency}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                              <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                <span>{product.location}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>{formatDate(product.created_at)}</span>
                              </div>
                            </div>

                            <div className="flex gap-2 pt-3 border-t border-gray-100">
                              <button
                                onClick={() =>
                                  router.push(`/product/${product.id}`)
                                }
                                className="flex-1 py-2 text-center rounded-lg transition-colors hover:bg-gray-100 text-blue-600"
                              >
                                <Eye className="w-4 h-4 inline ml-1" />
                                عرض
                              </button>
                              <button
                                onClick={() => handleEditProduct(product)}
                                className="flex-1 py-2 text-center rounded-lg transition-colors hover:bg-gray-100 text-green-600"
                              >
                                <Edit3 className="w-4 h-4 inline ml-1" />
                                تعديل
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(product.id)}
                                className="flex-1 py-2 text-center rounded-lg transition-colors hover:bg-gray-100 text-red-600"
                              >
                                <Trash2 className="w-4 h-4 inline ml-1" />
                                حذف
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {myAds.map((product) => (
                        <div
                          key={product.id}
                          className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200"
                        >
                          <div className="flex gap-3">
                            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg flex-shrink-0 overflow-hidden bg-gray-100 flex items-center justify-center">
                              <img
                                src={
                                  product.image_urls?.[0] ||
                                  "/placeholder-image.jpg"
                                }
                                alt={product.title}
                                className="max-w-full max-h-full object-contain"
                                onError={handleImageError}
                                loading="lazy"
                              />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col gap-2">
                                <div className="flex items-start justify-between">
                                  <h3 className="font-semibold text-gray-900 text-base sm:text-lg line-clamp-1">
                                    {product.title}
                                  </h3>
                                  <div
                                    className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ml-2 ${
                                      product.status === "active"
                                        ? "bg-green-500 text-white"
                                        : "bg-red-500 text-white"
                                    }`}
                                  >
                                    {product.status === "active"
                                      ? "نشط"
                                      : "غير نشط"}
                                  </div>
                                </div>

                                <div className="flex items-center justify-between">
                                  <span className="text-lg sm:text-xl font-bold text-green-600 flex-shrink-0">
                                    {formatPrice(product.price)}{" "}
                                    {product.currency}
                                  </span>
                                </div>

                                <p className="text-gray-600 text-sm line-clamp-2">
                                  {product.description}
                                </p>

                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-gray-500">
                                    <div className="flex items-center gap-1">
                                      <MapPin className="w-3 h-3" />
                                      <span className="truncate">
                                        {product.location}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      <span>
                                        {formatDate(product.created_at)}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex gap-1 sm:gap-2">
                                    <button
                                      onClick={() =>
                                        router.push(`/product/${product.id}`)
                                      }
                                      className="p-2 text-blue-600 hover:bg-gray-100 rounded-lg transition-colors"
                                      title="عرض"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleEditProduct(product)}
                                      className="p-2 text-green-600 hover:bg-gray-100 rounded-lg transition-colors"
                                      title="تعديل"
                                    >
                                      <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleDeleteProduct(product.id)
                                      }
                                      className="p-2 text-red-600 hover:bg-gray-100 rounded-lg transition-colors"
                                      title="حذف"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50">
        <div className="flex items-center justify-around h-16">
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
            className="flex flex-col items-center gap-1 p-2 rounded-lg transition-colors text-gray-600"
          >
            <PlusCircle className="w-5 h-5" />
          </button>

          <button
            onClick={() => router.push("/messages")}
            className="flex flex-col items-center gap-1 p-2 rounded-lg transition-colors text-gray-600"
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
