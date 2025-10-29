// page.js
"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import EditProductForm from "@/components/EditProductForm";
import AppLayout from "@/components/AppLayout";
import Image from "next/image";
import RemainingTime from "@/components/RemainingTime";
import { Package, Eye, MapPin, Calendar, Edit3, Trash2, Settings } from "lucide-react";

export default function Dashboard() {
  const supabase = createClient();
  const router = useRouter();

  // ✅ States مجمعة بشكل منطقي
  const [user, setUser] = useState(null);
  const [myAds, setMyAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editProductOpen, setEditProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // ✅ جلب البيانات مرة واحدة عند تحميل الصفحة
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 1. جلب المستخدم الحالي
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        
        if (!currentUser) {
          router.push("/login");
          return;
        }

        // 2. جلب الملف الشخصي
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", currentUser.id)
          .single();
        
        setUser(profile);
        console.log(profile.image_urls)
        // 3. جلب الإعلانات
        const { data: ads, error: adsError } = await supabase.rpc("get_my_ads");
        
        if (adsError) throw adsError;
        
        setMyAds(ads || []);
        
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("حدث خطأ في تحميل البيانات");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ✅ دالة حذف المنتج مبسطة
  const handleDeleteProduct = async (adId, imagePath) => {
    if (!confirm("هل أنت متأكد من حذف هذا الإعلان؟")) return;

    try {
      // حذف الإعلان من قاعدة البيانات
      const { error: deleteError } = await supabase
        .from("ads")
        .delete()
        .eq("id", adId)
        .eq("user_id", user?.id);

      if (deleteError) throw deleteError;

      // حذف الصورة من Storage
      if (imagePath) {
        const fileName = imagePath.split("product-images/")[1];
        await supabase.storage.from("product-images").remove([fileName]);
      }

      // تحديث القائمة محلياً بدون إعادة تحميل
      setMyAds(prev => prev.filter(ad => ad.id !== adId));
      alert("تم حذف الإعلان بنجاح ✅");
      
    } catch (err) {
      console.error("Error deleting product:", err);
      alert("حدث خطأ أثناء حذف الإعلان");
    }
  };

  // ✅ دالة تعديل المنتج
  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setEditProductOpen(true);
  };

  // ✅ دالة تحديث المنتج بعد التعديل
  const handleProductUpdated = (updatedProduct) => {
    setMyAds(prev => 
      prev.map(ad => ad.id === updatedProduct.id ? updatedProduct : ad)
    );
    setEditProductOpen(false);
    setEditingProduct(null);
  };

  // ✅ دوال التنسيق
  const formatPrice = (price) => new Intl.NumberFormat("ar-SY").format(price);
  const formatDate = (dateString) => new Date(dateString).toLocaleDateString("ar-SY", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  // ✅ حساب الإحصائيات
  const stats = {
    total: myAds.length,
    active: myAds.filter(ad => ad.status === "active").length,
    expired: myAds.filter(ad => ad.status === "expired").length,
  };

  // ✅ التحقق من اكتمال الملف الشخصي
  const isProfileIncomplete = user && (!user.full_name || !user.avatar_url || !user.location);

  return (
    <AppLayout>
      {/* نافذة تعديل المنتج */}
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
        {/* رأس الموبايل */}
        <div className="md:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3 mb-4 rounded-lg">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">لوحة التحكم</h1>
            <button
              onClick={() => router.push("/settings")}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Settings className="w-6 h-6 text-gray-700 dark:text-gray-200" />
            </button>
          </div>
        </div>

        {/* ✅ معلومات المستخدم - محمية من null */}
        {user && (
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm dark:shadow-gray-900/30 p-4 mb-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <Image
                src={user.avatar_url || "/avatar.svg"}
                width={32}
                height={32}
                className="rounded-full border-2 border-gray-200 object-cover w-12 h-12 dark:border-gray-700"
                alt="صورة المستخدم"
              />
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white truncate">
                  {user.full_name || "مستخدم جديد"}
                </h2>
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
        )}

        {/* ✅ تنبيه اكتمال الملف الشخصي */}
        {isProfileIncomplete && (
          <div className="bg-yellow-50 dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/30 p-4 mb-6 border border-yellow-200 dark:border-yellow-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-lg">!</span>
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-800 dark:text-gray-100">
                  ملفك الشخصي غير مكتمل
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
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

        {/* ✅ قسم المنتجات */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm dark:shadow-gray-900/30 border border-gray-200 dark:border-gray-700">
          {/* رأس القسم */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  منتجاتي ({stats.total})
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  {stats.active} نشط • {stats.expired} منتهي
                </p>
              </div>
            </div>
          </div>

          {/* محتوى المنتجات */}
          <div className="p-6">
            {/* ✅ حالة التحميل */}
            {loading && (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-300">جاري تحميل منتجاتك...</p>
              </div>
            )}

            {/* ✅ حالة الخطأ */}
            {error && !loading && (
              <div className="text-center py-12">
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600"
                >
                  إعادة المحاولة
                </button>
              </div>
            )}

            {/* ✅ لا توجد منتجات */}
            {!loading && !error && myAds.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full mx-auto mb-4 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <Package className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  لا توجد منتجات بعد
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  ابدأ ببيع منتجاتك الآن وزد دخلك!
                </p>
                <button
                  onClick={() => router.push("/add-product")}
                  className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors font-medium"
                >
                  أضف أول منتج
                </button>
              </div>
            )}

            {/* ✅ قائمة المنتجات */}
            {!loading && !error && myAds.length > 0 && (
              <div className="space-y-3">
                {myAds.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm dark:shadow-gray-900/30 hover:shadow-md dark:hover:shadow-gray-900/30 transition-all duration-200 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex gap-3">
                      {/* صورة المنتج */}
                      <div className="w-6 h-5 sm:w-24 sm:h-24 rounded-lg flex-shrink-0 overflow-hidden bg-gray-100 dark:bg-gray-800 relative">
                        <Image
                          src={product.image_urls?.[0] || "/placeholder-image.jpg"}
                          alt={product.title}
                          width={800}
                          height={600}
                          className="object-cover w-200 h-100"
                        />
                      </div>

                      {/* تفاصيل المنتج */}
                      <div className="flex-1 min-w-0">
                        {/* العنوان والحالة */}
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white text-base sm:text-lg line-clamp-1">
                            {product.title}
                          </h3>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ml-2 ${
                              product.status === "active"
                                ? "bg-green-500 text-white"
                                : "bg-red-500 text-white"
                            }`}
                          >
                            {product.status === "active" ? "نشط" : "منتهي"}
                          </span>
                        </div>

                        {/* الوصف */}
                        <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2 mb-2">
                          {product.description}
                        </p>

                        {/* السعر */}
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-lg sm:text-xl font-bold text-green-600">
                            {formatPrice(product.price)} {product.currency}
                          </span>
                        </div>

                        {/* الوقت المتبقي */}
                        <div className="mb-3">
                          <RemainingTime expiresAt={product.expires_at} />
                        </div>

                        {/* الموقع والتاريخ والأزرار */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              <span className="truncate">{product.location}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>{formatDate(product.created_at)}</span>
                            </div>
                          </div>

                          {/* أزرار التحكم */}
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
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="تعديل"
                              disabled={product.status === "expired"}
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id, product.image_urls[0])}
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