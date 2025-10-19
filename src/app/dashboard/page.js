// page.js
"use client";

import { createClient } from "../../../lib/supabase";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import EditProductForm from "@/app/components/EditProductForm";
import AppLayout from "@/app/components/AppLayout";
import Image from "next/image";
import RemainingTime from "../components/RemainingTime";

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
  });
  const [editProductOpen, setEditProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // التحقق من المصادقة وجلب الملف الشخصي
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const {
          data: { user: currentUser },
          error: authError,
        } = await supabase.auth.getUser();
        // جلب الملف الشخصي (بدون إنشاء - الـ Trigger يتكفل بذلك)
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", currentUser.id)
          .single();
        setUser(profile);
      } catch (error) {
        console.error("Profile fetch unexpected error:", error);
      }
    };
    fetchProfile();
  }, [router, supabase]);

  // جلب منتجات المستخدم
  useEffect(() => {
    const fetchMyAds = async () => {
      try {
        setLoading(true);
        setError(null);
        // استدعاء الدالة بدون تمرير user.id
        const { data, error } = await supabase.rpc("get_my_ads");
        if (error) throw error;
        setMyAds(data || []);

        // حساب الإحصائيات
        const total = data?.length || 0;
        const active = data?.filter((ad) => ad.status === "active").length || 0;
        const expired =
          data?.filter((ad) => ad.status === "expired").length || 0;

        setStats({ total, active, expired });
      } catch (err) {
        console.error("Error fetching ads:", err);
        setError("حدث خطأ في تحميل منتجاتك");
      } finally {
        setLoading(false);
      }
    };
    fetchMyAds();
  }, [user, supabase]);

  const extractFileName = (imageUrl) => {
    // نبحث عن الجزء بعد "product-images/"
    const parts = imageUrl.split("product-images/");
    return parts.length > 1 ? parts[1] : null;
  };

  const handleDeleteProduct = async (adId, imagePath) => {
    if (!confirm("هل أنت متأكد من حذف هذا الإعلان؟")) return;

    try {
      // 1. حذف الإعلان من جدول ads
      const { error: deleteError } = await supabase
        .from("ads")
        .delete()
        .eq("id", adId)
        .eq("user_id", user.id); // تأكد من أنه مالك الإعلان

      if (deleteError) {
        console.error("خطأ في حذف الإعلان:", deleteError);
        alert("فشل حذف الإعلان: " + deleteError.message);
        return;
      }

      // 2. حذف الصورة من Storage
      if (imagePath) {
        const fileName = extractFileName(imagePath);
        // مثال على imagePath: "138324dc-73e6-43ee-a911-a4d0dd56eaa9.jpg"
        const { error: imageError } = await supabase.storage
          .from("product-images")
          .remove([fileName]);

        if (imageError) {
          console.error("خطأ في حذف الصورة من التخزين:", imageError);
          alert("تم حذف الإعلان، لكن لم يتم حذف الصورة من التخزين.");
        } else {
          console.log("✅ تم حذف الصورة من التخزين بنجاح");
        }
      }

      // 3. إعلام المستخدم بالنجاح
      alert("تم حذف الإعلان بنجاح ✅");
      router.push("/main");
    } catch (err) {
      console.error("❌ خطأ غير متوقع:", err);
      alert("حدث خطأ غير متوقع أثناء حذف الإعلان");
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
    // bg-green-500 لا يتغير
    // text-white لا يتغير
    // shadow-lg -> dark:shadow-gray-900/50
    successDiv.className =
      "fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg dark:shadow-gray-900/50 z-50";
    successDiv.textContent = message;
    document.body.appendChild(successDiv);

    setTimeout(() => {
      successDiv.remove();
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
        {/* bg-white -> dark:bg-gray-900 (خلفية الشاشة الكاملة يمكن أن تستفيد من ذلك، على الرغم من أن AppLayout قد يكون مسؤولاً) */}
        <div className="flex items-center justify-center min-h-screen">
          {/* border-red-500 لا يتغير */}
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
        />
      )}

      <div className="p-4 md:p-6 max-w-6xl mx-auto">
        {/* Mobile Header */}
        {/* bg-white -> dark:bg-gray-900 */}
        {/* border-gray-200 -> dark:border-gray-700 */}
        <div className="md:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3 mb-4 rounded-lg">
          <div className="flex items-center justify-between">
            {/* text-gray-900 -> dark:text-white */}
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">لوحة التحكم</h1>
            <button
              onClick={() => router.push("/settings")}
              // hover:bg-gray-100 -> dark:hover:bg-gray-700
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              {/* text-gray-700 -> dark:text-gray-200 */}
              <Settings className="w-6 h-6 text-gray-700 dark:text-gray-200" />
            </button>
          </div>
        </div>

        {/* User Info Card */}
        {/* bg-white -> dark:bg-gray-900 */}
        {/* shadow-sm -> dark:shadow-gray-900/30 */}
        {/* border-gray-200 -> dark:border-gray-700 */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm dark:shadow-gray-900/30 p-4 mb-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <Image
              src={user.avatar_url || "/avatar.svg"}
              alt={user.full_name || "Avatar"}
              width={64}
              height={64}
              // border-gray-300 -> dark:border-gray-600
              className="rounded-full border border-gray-300 dark:border-gray-600 object-cover w-14 h-14"
              priority
            />
            <div className="flex-1 min-w-0">
              {/* text-gray-900 -> dark:text-white */}
              <h2 className="text-xl font-bold text-gray-900 dark:text-white truncate">
                {user.full_name || "مستخدم جديد"}
              </h2>
              {/* text-gray-600 -> dark:text-gray-300 */}
              <div className="flex flex-wrap gap-3 mt-1 text-sm text-gray-600 dark:text-gray-300">
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
        {(!user.full_name || !user.avatar_url || !user.location) && (
          // bg-yellow-50 -> dark:bg-gray-800
          // shadow-sm -> dark:shadow-gray-900/30
          // border-yellow-200 -> dark:border-yellow-700 (لون ملون، لا يتغير لكن نجعله أغمق لتحسين التباين)
          <div className="bg-yellow-50 dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/30 p-4 mb-6 border border-yellow-200 dark:border-yellow-700">
            <div className="flex items-center gap-3">
              {/* bg-yellow-500 لا يتغير */}
              <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center flex-shrink-0">
                {/* text-white لا يتغير */}
                <span className="text-white font-bold text-lg">!</span>
              </div>
              <div className="flex-1">
                {/* text-gray-800 -> dark:text-gray-100 */}
                <div className="font-semibold text-gray-800 dark:text-gray-100">
                  ملفك الشخصي غير مكتمل
                </div>
                {/* text-gray-600 -> dark:text-gray-300 */}
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  أكمل بياناتك للحصول على تجربة أفضل
                </div>
              </div>
              {/* الألوان الملونة لا تتغير */}
              <button
                onClick={() => router.push("/settings")}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors font-medium flex-shrink-0"
              >
                أكمل الآن
              </button>
            </div>
          </div>
        )}

        {/* Products Section */}
        {/* bg-white -> dark:bg-gray-900 */}
        {/* shadow-sm -> dark:shadow-gray-900/30 */}
        {/* border-gray-200 -> dark:border-gray-700 */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm dark:shadow-gray-900/30 border border-gray-200 dark:border-gray-700">
          {/* border-gray-200 -> dark:border-gray-700 */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                {/* text-gray-900 -> dark:text-white */}
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  منتجاتي ({myAds.length})
                </h2>
                {/* text-gray-600 -> dark:text-gray-300 */}
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  إدارة وتعديل منتجاتك المنشورة
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                {/* border-red-500 لا يتغير */}
                <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                {/* text-gray-600 -> dark:text-gray-300 */}
                <p className="text-gray-600 dark:text-gray-300">جاري تحميل منتجاتك...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                {/* text-red-600 لا يتغير */}
                <p className="text-red-600 mb-4">{error}</p>
                {/* الألوان الملونة لا تتغير */}
                <button
                  onClick={() => window.location.reload()}
                  className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600"
                >
                  إعادة المحاولة
                </button>
              </div>
            ) : myAds.length === 0 ? (
              <div className="text-center py-12">
                {/* bg-gray-100 -> dark:bg-gray-800 */}
                <div className="w-16 h-16 rounded-full mx-auto mb-4 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  {/* text-gray-400 لا يتغير */}
                  <Package className="w-8 h-8 text-gray-400" />
                </div>
                {/* text-gray-700 -> dark:text-gray-200 */}
                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  لا توجد منتجات بعد
                </h3>
                {/* text-gray-500 -> dark:text-gray-400 */}
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  ابدأ ببيع منتجاتك الآن وزد دخلك!
                </p>
                {/* الألوان الملونة لا تتغير */}
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
                    // bg-white -> dark:bg-gray-900
                    // shadow-sm -> dark:shadow-gray-900/30
                    // hover:shadow-md -> dark:hover:shadow-gray-900/30
                    // border-gray-200 -> dark:border-gray-700
                    className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm dark:shadow-gray-900/30 hover:shadow-md dark:hover:shadow-gray-900/30 transition-all duration-200 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex gap-3">
                      {/* bg-gray-100 -> dark:bg-gray-800 */}
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg flex-shrink-0 overflow-hidden bg-gray-100 dark:bg-gray-800 relative">
                        <Image
                          src={
                            product.image_urls?.[0] || "/placeholder-image.jpg"
                          }
                          alt={product.title}
                          fill
                          className="object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          {/* text-gray-900 -> dark:text-white */}
                          <h3 className="font-semibold text-gray-900 dark:text-white text-base sm:text-lg line-clamp-1">
                            {product.title}
                          </h3>
                          {/* الألوان الملونة لا تتغير */}
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
                          </div>
                        </div>

                        {/* text-gray-600 -> dark:text-gray-300 */}
                        <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2 mb-2">
                          {product.description}
                        </p>

                        {/* text-green-600 لا يتغير */}
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-lg sm:text-xl font-bold text-green-600">
                            {formatPrice(product.price)} {product.currency}
                          </span>
                        </div>
                        <div className="mb-3">
                          <RemainingTime expiresAt={product.expires_at} />
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          {/* text-gray-500 -> dark:text-gray-400 */}
                          <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              <span className="truncate">
                                {product.location}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>{formatDate(product.created_at)}</span>
                            </div>
                          </div>

                          {/* الأزرار: الألوان الملونة لا تتغير، لكن نغير hover:bg الرمادي */}
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                router.push(`/product/${product.id}`)
                              }
                              // hover:bg-blue-50 لا يتغير لأنه لون ملون
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="عرض"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEditProduct(product)}
                              // hover:bg-green-50 لا يتغير لأنه لون ملون
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="تعديل"
                              disabled={product.status === "expired"}
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteProduct(
                                  product.id,
                                  product.image_urls[0]
                                )
                              }
                              // hover:bg-red-50 لا يتغير لأنه لون ملون
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