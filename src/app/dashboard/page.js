"use client";
import React from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

import { getCurrentUser } from "../../utils/auth";
import ProfileEditForm from "./ProfileEditForm";
import EditProductForm from "../components/EditProductForm";
import { validateProduct, cleanText, parsePrice } from "../../utils/validation";
import {
  Home,
  Search,
  PlusCircle,
  Settings,
  User,
  Bell,
  Package,
  DollarSign,
  ShoppingCart,
  Heart,
  Layers,
  MapPin,
  ThumbsUp,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  Send,
  X,
  Edit3,
  Trash2,
  Download,
  Upload,
  Info,
  Grid,
  List,
  Filter,
  Plus,
  Calendar,
  Eye,
  ChevronDown,
  LogOut,
} from "lucide-react";

import { usePathname } from "next/navigation";

export default function Dashboard() {
  const supabase = createClientComponentClient();
  const router = useRouter();

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
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [editProductOpen, setEditProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [viewMode, setViewMode] = useState("grid");
  const [showUserMenu, setShowUserMenu] = useState(false); // إضافة حالة القائمة المنسدلة

  const pathname = usePathname(); // أضف هذا السطر بعد router

  // التحقق من المصادقة وجلب/إنشاء الملف الشخصي
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
          console.log("Profile created successfully:", newProfile);
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

  const handleProductAdded = (newProduct) => {
    setMyAds((prevAds) => [newProduct, ...prevAds]);
    setStats((prev) => ({
      total: prev.total + 1,
      active: prev.active + 1,
      views: prev.views,
    }));
    showSuccessMessage("تم إضافة المنتج بنجاح!");
  };

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

  const handleLogout = async () => {
    if (!window.confirm("هل أنت متأكد من تسجيل الخروج؟")) {
      return;
    }
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw new Error(error.message);
      }
      router.push("/");
    } catch (err) {
      console.error("Error signing out:", err);
      alert("حدث خطأ في تسجيل الخروج");
    }
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
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#F0F2F5" }}
      >
        <div className="text-center">
          <div
            className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: "#1877F2", borderTopColor: "transparent" }}
          ></div>
          <p className="text-gray-600">جاري التحقق من المصادقة...</p>
        </div>
      </div>
    );
  }

  const isProfileIncomplete = !user.avatar_url || !user.location;

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "#F0F2F5" }}
      dir="rtl"
      lang="ar"
    >
      {editProductOpen && editingProduct && (
        <EditProductForm
          product={editingProduct}
          onClose={() => {
            setEditProductOpen(false);
            setEditingProduct(null);
          }}
          onProductUpdated={handleProductUpdated}
          supabase={supabase} // تأكد من وجود هذا السطر
        />
      )}
      {/* Facebook-style Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center h-16">
            {/* Right Section - Logo and Search */}
            <div className="flex items-center gap-4 flex-1">
              <h1 className="text-2xl font-bold" style={{ color: "#1877F2" }}>
                المتجر
              </h1>
              <div className="hidden md:block relative">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="البحث في المنتجات..."
                    className="w-64 pl-4 pr-12 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Center Section - Navigation */}
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={() => router.push("/main")}
                className={`p-3 rounded-lg transition-colors flex items-center gap-2 font-medium relative ${
                  pathname === "/main"
                    ? "text-blue-600"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
                style={{ color: pathname === "/main" ? "#1877F2" : "" }}
              >
                <Home className="w-5 h-5" />
                الرئيسية
                {pathname === "/main" && (
                  <span
                    className="absolute left-0 right-0 h-1 rounded-t-full"
                    style={{ backgroundColor: "#1877F2", bottom: "-9px" }}
                  ></span>
                )}
              </button>

              <button
                onClick={() => router.push("/dashboard")}
                className={`p-3 rounded-lg transition-colors flex items-center gap-2 font-medium relative ${
                  pathname === "/dashboard"
                    ? "text-blue-600"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
                style={{ color: pathname === "/dashboard" ? "#1877F2" : "" }}
              >
                <User className="w-5 h-5" />
                لوحة التحكم
                {pathname === "/dashboard" && (
                  <span
                    className="absolute bottom-1 left-0 right-0 h-1 rounded-t-full"
                    style={{ backgroundColor: "#1877F2", bottom: "-9px" }}
                  ></span>
                )}
              </button>
            </div>

            {/* Left Section - Add Product and User Menu */}
            {/* Left Section - Add Product and User Menu - Desktop Only */}
            {/* Left Section - Add Product and User Menu */}
            <div className="flex items-center gap-3 flex-1 justify-end">
              {/* Add Product Button - Desktop Only */}
              <button
                onClick={() => router.push("/add-product")}
                className="hidden md:flex text-white px-4 py-2 rounded-lg hover:opacity-90 transition-colors items-center gap-2 font-medium"
                style={{ backgroundColor: "#1877F2" }}
              >
                <Plus className="w-4 h-4" />
                أضف إعلان
              </button>

              {/* User Menu Container - Always Visible */}
              <div className="relative user-menu-container">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="relative flex items-center gap-1 p-1 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                  title="قائمة المستخدم"
                >
                  <img
                    src={user.avatar_url || "/avatar.svg"}
                    alt="صورة المستخدم"
                    className="w-10 h-10 rounded-full border-2 border-gray-200 object-cover bg-white"
                    onError={(e) => {
                      e.target.src = "/avatar.svg";
                    }}
                  />
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      showUserMenu ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute left-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <img
                          src={user.avatar_url || "/avatar.svg"}
                          alt="صورة المستخدم"
                          className="w-12 h-12 rounded-full border-2 border-gray-200 object-cover bg-white"
                          onError={(e) => {
                            e.target.src = "/avatar.svg";
                          }}
                        />
                        <div>
                          <div className="font-semibold text-gray-800 text-sm">
                            {user.full_name || "مستخدم جديد"}
                          </div>
                          <div className="text-gray-600 text-xs">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setProfileOpen(true);
                          setShowUserMenu(false);
                        }}
                        className="w-full px-4 py-3 text-right hover:bg-gray-50 transition-colors flex items-center gap-3"
                      >
                        <User className="w-5 h-5 text-gray-500" />
                        <span className="text-gray-800">
                          تعديل الملف الشخصي
                        </span>
                      </button>

                      <button
                        onClick={() => {
                          handleLogout();
                          setShowUserMenu(false);
                        }}
                        className="w-full px-4 py-3 text-right hover:bg-gray-50 transition-colors flex items-center gap-3"
                      >
                        <LogOut className="w-5 h-5 text-gray-500" />
                        <span className="text-gray-800">تسجيل الخروج</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Navigation */}
            {/* Mobile Navigation - Simple 3 buttons */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-30">
              <div className="flex items-center justify-around">
                <button
                  onClick={() => router.push("/main")}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg transition-colors ${
                    pathname === "/main" ? "text-blue-600" : "text-gray-600"
                  }`}
                >
                  <Home className="w-6 h-6" />
                  <span className="text-xs">الرئيسية</span>
                </button>

                <button
                  onClick={() => router.push("/add-product")}
                  className="flex flex-col items-center gap-1 p-3 rounded-lg text-blue-600"
                >
                  <PlusCircle className="w-6 h-6" />
                  <span className="text-xs">إضافة</span>
                </button>

                <button
                  onClick={() => router.push("/dashboard")}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg transition-colors ${
                    pathname === "/dashboard"
                      ? "text-blue-600"
                      : "text-gray-600"
                  }`}
                >
                  <User className="w-6 h-6" />
                  <span className="text-xs">لوحة التحكم</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Profile Alert */}
        {isProfileIncomplete && (
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-200">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "#F39C12" }}
              >
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
                className="text-white px-4 py-2 rounded-lg hover:opacity-90 transition-colors font-medium"
                style={{ backgroundColor: "#1877F2" }}
                onClick={() => setProfileOpen(true)}
              >
                أكمل الملف الشخصي
              </button>
            </div>
          </div>
        )}

        {/* User Info Card - أصغر وأكثر تنظيماً */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <img
              src={user.avatar_url || "/avatar.svg"}
              alt="صورة المستخدم"
              className="w-16 h-16 rounded-full border-2 object-cover bg-white"
              style={{ borderColor: "#1877F2" }}
              onError={(e) => {
                e.target.src = "/avatar.svg";
              }}
            />
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-gray-800 truncate">
                {user.full_name || "مستخدم جديد"}
              </h2>
              <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-600">
                <span className="flex items-center gap-1">
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  {user.email}
                </span>
                {user.phone && (
                  <span className="flex items-center gap-1">
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    {user.phone}
                  </span>
                )}
                {user.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {user.location}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards - أصغر وأكثر تنظيماً */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-200 text-center">
            <div
              className="w-8 h-8 rounded-lg mx-auto mb-2 flex items-center justify-center"
              style={{ backgroundColor: "#E8F4FD" }}
            >
              <Package className="w-4 h-4" style={{ color: "#1877F2" }} />
            </div>
            <p className="text-xs text-gray-600 mb-1">إجمالي المنتجات</p>
            <p className="text-lg font-bold" style={{ color: "#1877F2" }}>
              {stats.total}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-200 text-center">
            <div
              className="w-8 h-8 rounded-lg mx-auto mb-2 flex items-center justify-center"
              style={{ backgroundColor: "#42B883", opacity: 0.1 }}
            >
              <svg
                className="w-4 h-4"
                style={{ color: "#42B883" }}
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
            <p className="text-xs text-gray-600 mb-1">منتجات نشطة</p>
            <p className="text-lg font-bold" style={{ color: "#42B883" }}>
              {stats.active}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-200 text-center">
            <div className="w-8 h-8 rounded-lg mx-auto mb-2 flex items-center justify-center bg-purple-100">
              <Eye className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-xs text-gray-600 mb-1">إجمالي المشاهدات</p>
            <p className="text-lg font-bold text-purple-600">{stats.views}</p>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-red-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <X className="w-5 h-5 text-red-500" />
              </div>
              <p className="flex-1 text-red-700">{error}</p>
              <button
                onClick={() => fetchMyAds(true)}
                className="text-white px-4 py-2 rounded-lg hover:opacity-90"
                style={{ backgroundColor: "#E74C3C" }}
              >
                إعادة المحاولة
              </button>
            </div>
          </div>
        )}

        {/* Products Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
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
                      ? "bg-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-200"
                  }`}
                  style={{ color: viewMode === "grid" ? "#1877F2" : undefined }}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === "list"
                      ? "bg-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-200"
                  }`}
                  style={{ color: viewMode === "list" ? "#1877F2" : undefined }}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div
                  className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
                  style={{
                    borderColor: "#1877F2",
                    borderTopColor: "transparent",
                  }}
                ></div>
                <p className="text-gray-600">جاري تحميل منتجاتك...</p>
              </div>
            ) : myAds.length === 0 ? (
              <div className="text-center py-12">
                <div
                  className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                  style={{ backgroundColor: "#E8F4FD" }}
                >
                  <Package className="w-8 h-8" style={{ color: "#1877F2" }} />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  لا توجد منتجات بعد
                </h3>
                <p className="text-gray-500 mb-6">
                  ابدأ ببيع منتجاتك الآن وزد دخلك!
                </p>
                <button
                  onClick={() => router.push("/add-product")}
                  className="text-white px-6 py-3 rounded-lg hover:opacity-90 transition-colors font-medium"
                  style={{ backgroundColor: "#42B883" }}
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
                          <div className="h-48 overflow-hidden">
                            <img
                              src={
                                product.image_urls?.[0] ||
                                "/placeholder-image.jpg"
                              }
                              alt={product.title}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                              onError={handleImageError}
                              loading="lazy"
                            />
                          </div>
                          <div
                            className="absolute top-3 right-3 text-white text-xs px-2 py-1 rounded-full font-medium"
                            style={{ backgroundColor: "#1877F2" }}
                          >
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
                            <span
                              className="text-lg font-bold"
                              style={{ color: "#42B883" }}
                            >
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
                              className="flex-1 py-2 text-center rounded-lg transition-colors hover:bg-gray-100"
                              style={{ color: "#1877F2" }}
                            >
                              <Eye className="w-4 h-4 inline ml-1" />
                              عرض
                            </button>
                            <button
                              onClick={() => handleEditProduct(product)}
                              className="flex-1 py-2 text-center rounded-lg transition-colors hover:bg-gray-100"
                              style={{ color: "#42B883" }}
                            >
                              <Edit3 className="w-4 h-4 inline ml-1" />
                              تعديل
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="flex-1 py-2 text-center rounded-lg transition-colors hover:bg-gray-100"
                              style={{ color: "#E74C3C" }}
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
                  /* List View - محسن للهاتف المحمول */
                  <div className="space-y-3">
                    {myAds.map((product) => (
                      <div
                        key={product.id}
                        className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200"
                      >
                        <div className="flex gap-3">
                          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg flex-shrink-0 overflow-hidden">
                            <img
                              src={
                                product.image_urls?.[0] ||
                                "/placeholder-image.jpg"
                              }
                              alt={product.title}
                              className="w-full h-full object-cover"
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
                                <span
                                  className="text-lg sm:text-xl font-bold flex-shrink-0"
                                  style={{ color: "#42B883" }}
                                >
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
                                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                    title="عرض"
                                  >
                                    <Eye
                                      className="w-4 h-4"
                                      style={{ color: "#1877F2" }}
                                    />
                                  </button>
                                  <button
                                    onClick={() => handleEditProduct(product)}
                                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                    title="تعديل"
                                  >
                                    <Edit3
                                      className="w-4 h-4"
                                      style={{ color: "#42B883" }}
                                    />
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDeleteProduct(product.id)
                                    }
                                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                    title="حذف"
                                  >
                                    <Trash2
                                      className="w-4 h-4"
                                      style={{ color: "#E74C3C" }}
                                    />
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

        {/* Tips Section */}
        {myAds.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6 mt-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "#E8F4FD" }}
              >
                <svg
                  className="w-5 h-5"
                  style={{ color: "#1877F2" }}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">
                نصائح لزيادة المبيعات
              </h3>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="flex items-start gap-2">
                <div
                  className="w-2 h-2 rounded-full mt-2"
                  style={{ backgroundColor: "#1877F2" }}
                ></div>
                <p className="text-sm text-gray-600">
                  أضف صور واضحة وجذابة لمنتجاتك
                </p>
              </div>
              <div className="flex items-start gap-2">
                <div
                  className="w-2 h-2 rounded-full mt-2"
                  style={{ backgroundColor: "#1877F2" }}
                ></div>
                <p className="text-sm text-gray-600">
                  اكتب وصف مفصل ودقيق للمنتج
                </p>
              </div>
              <div className="flex items-start gap-2">
                <div
                  className="w-2 h-2 rounded-full mt-2"
                  style={{ backgroundColor: "#1877F2" }}
                ></div>
                <p className="text-sm text-gray-600">
                  استخدم أسعار تنافسية مقارنة بالسوق
                </p>
              </div>
              <div className="flex items-start gap-2">
                <div
                  className="w-2 h-2 rounded-full mt-2"
                  style={{ backgroundColor: "#1877F2" }}
                ></div>
                <p className="text-sm text-gray-600">
                  رد على استفسارات المشترين بسرعة
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Bottom Spacing */}
      <div className="md:hidden h-20"></div>
    </div>
  );
}
