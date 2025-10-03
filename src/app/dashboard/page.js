"use client";

import { createClient } from '../../../lib/supabase';
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import EditProductForm from "../components/EditProductForm";
import AppLayout from "../components/AppLayout";
import Image from 'next/image';
import {
  Package,
  Eye,
  MapPin,
  Calendar,
  Edit3,
  Trash2,
  Settings,
} from "lucide-react";

export default function Dashboard() {
  const supabase = createClient();
  const router = useRouter();
  
  const [user, setUser] = useState(null);
  const [myAds, setMyAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expired: 0,
    views: 0,
  });
  const [editProductOpen, setEditProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // التحقق من المصادقة وجلب الملف الشخصي
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !currentUser) {
          router.push("/");
          return;
        }

        // جلب أو إنشاء الملف الشخصي
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", currentUser.id)
          .maybeSingle();

        if (profileError && profileError.code !== "PGRST116") {
          console.error("Profile fetch error:", profileError);
        }

        if (profile) {
          setUser(profile);
          return;
        }

        // إنشاء ملف شخصي جديد
        const newProfile = {
          id: currentUser.id,
          email: currentUser.email,
          full_name: currentUser.user_metadata?.full_name || "",
          phone: currentUser.user_metadata?.phone || "",
          location: "",
          avatar_url: "",
        };

        const { data: createdProfile, error: createError } = await supabase
          .from("profiles")
          .insert([newProfile])
          .select()
          .single();

        setUser(createdProfile || newProfile);

        if (createError) {
          console.error("Error creating profile:", createError);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        router.push("/");
      }
    };

    checkAuth();
  }, [supabase, router]);

  // جلب منتجات المستخدم
  const fetchMyAds = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("ads")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      setMyAds(data || []);

      // حساب الإحصائيات
      const total = data?.length || 0;
      const active = data?.filter((ad) => ad.status === "active").length || 0;
      const expired = data?.filter((ad) => ad.status === "expired").length || 0;

      setStats({
        total,
        active,
        expired,
        views: total * 12, // يمكن استبدالها بعدد حقيقي من قاعدة البيانات
      });
    } catch (err) {
      console.error("Error fetching ads:", err);
      setError("حدث خطأ في تحميل منتجاتك");
    } finally {
      setLoading(false);
    }
  }, [supabase, user]);

  useEffect(() => {
    if (user) {
      fetchMyAds();
    }
  }, [user, fetchMyAds]);

  // حذف منتج
  const handleDeleteProduct = async (productId) => {
    if (!confirm("هل أنت متأكد من حذف هذا المنتج؟")) return;

    try {
      const { error } = await supabase
        .from("ads")
        .delete()
        .eq("id", productId)
        .eq("user_id", user.id);

      if (error) throw error;

      // تحديث الحالة المحلية
      setMyAds((prev) => prev.filter((ad) => ad.id !== productId));
      setStats((prev) => ({
        ...prev,
        total: prev.total - 1,
        active: prev.active - 1,
      }));

      showSuccessMessage("تم حذف المنتج بنجاح");
    } catch (err) {
      console.error("Error deleting product:", err);
      alert("حدث خطأ في حذف المنتج");
    }
  };

  // تحديث منتج
  const handleProductUpdated = (updatedProduct) => {
    setMyAds((prev) =>
      prev.map((ad) => (ad.id === updatedProduct.id ? updatedProduct : ad))
    );
    showSuccessMessage("تم تحديث المنتج بنجاح!");
    setEditProductOpen(false);
    setEditingProduct(null);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setEditProductOpen(true);
  };

  // عرض رسالة نجاح
  const showSuccessMessage = (message) => {
    const successDiv = document.createElement("div");
    successDiv.className =
      "fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-in";
    successDiv.textContent = message;
    document.body.appendChild(successDiv);

    setTimeout(() => {
      successDiv.classList.add("animate-slide-out");
      setTimeout(() => {
        document.body.removeChild(successDiv);
      }, 300);
    }, 3000);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("ar-SY").format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("ar-SY", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // حساب الوقت المتبقي
  const getRemainingTime = (expiresAt) => {
    if (!expiresAt) return null;
    
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry - now;
    
    if (diff <= 0) return "منتهي";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days} يوم`;
    return `${hours} ساعة`;
  };

  if (!user) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
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

      <div className="p-4 md:p-6 max-w-6xl mx-auto">
        {/* Mobile Header */}
        <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 mb-4 rounded-lg">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-gray-900">لوحة التحكم</h1>
            <button
              onClick={() => router.push("/settings")}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Settings className="w-6 h-6 text-gray-700" />
            </button>
          </div>
        </div>

        {/* User Info Card */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-200">
          <div className="flex items-center gap-4">
            <Image
              src={user.avatar_url || "/avatar.svg"}
              alt="صورة المستخدم"
              width={64}
              height={64}
              className="rounded-full border-2 border-red-500 object-cover"
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
              <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-lg">!</span>
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
                onClick={() => router.push("/settings")}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors font-medium flex-shrink-0"
              >
                أكمل الآن
              </button>
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200 text-center">
            <div className="w-8 h-8 rounded-lg mx-auto mb-2 bg-blue-100 flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
            <p className="text-sm text-gray-600">إجمالي</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200 text-center">
            <div className="w-8 h-8 rounded-lg mx-auto mb-2 bg-green-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            <p className="text-sm text-gray-600">نشط</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200 text-center">
            <div className="w-8 h-8 rounded-lg mx-auto mb-2 bg-red-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
            <p className="text-sm text-gray-600">منتهي</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200 text-center">
            <div className="w-8 h-8 rounded-lg mx-auto mb-2 bg-purple-100 flex items-center justify-center">
              <Eye className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-purple-600">{stats.views}</p>
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
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">جاري تحميل منتجاتك...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={fetchMyAds}
                  className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600"
                >
                  إعادة المحاولة
                </button>
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
                  أضف أول منتج
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {myAds.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200"
                  >
                    <div className="flex gap-3">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg flex-shrink-0 overflow-hidden bg-gray-100 relative">
                        <Image
                          src={product.image_urls?.[0] || "/placeholder-image.jpg"}
                          alt={product.title}
                          fill
                          className="object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-gray-900 text-base sm:text-lg line-clamp-1">
                            {product.title}
                          </h3>
                          <div className="flex gap-2 flex-shrink-0 ml-2">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                product.status === "active"
                                  ? "bg-green-500 text-white"
                                  : "bg-red-500 text-white"
                              }`}
                            >
                              {product.status === "active" ? "نشط" : "منتهي"}
                            </span>
                            {product.status === "active" && product.expires_at && (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-600">
                                {getRemainingTime(product.expires_at)}
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                          {product.description}
                        </p>

                        <div className="flex items-center justify-between mb-2">
                          <span className="text-lg sm:text-xl font-bold text-green-600">
                            {formatPrice(product.price)} {product.currency}
                          </span>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="flex gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              <span className="truncate">{product.location}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>{formatDate(product.created_at)}</span>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => router.push(`/product/${product.id}`)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="عرض"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEditProduct(product)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="تعديل"
                              disabled={product.status === "expired"}
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="حذف"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}