"use client";

import { createClient } from '../../../lib/supabase';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Calendar, Trash2, HeartOff } from "lucide-react";
import { getUserLikedProducts, removeLike } from "../../utils/likes";
import AppLayout from "../components/AppLayout";
import Image from 'next/image';

export default function FavoritesPage() {
  const supabase = createClient();
  const router = useRouter();

  // الحالات الخاصة بالصفحة فقط
  const [currentUser, setCurrentUser] = useState(null);
  const [likedProducts, setLikedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removingLike, setRemovingLike] = useState(null);

  // التحقق من المصادقة وجلب بيانات المستخدم
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        router.push("/main");
        return;
      }

      // جلب بيانات الملف الشخصي
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
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
  const handleRemoveLike = async (productId) => {
    if (!confirm("هل تريد إزالة هذا المنتج من المُفضلة؟")) {
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
      <AppLayout>
        <div className="p-4 md:p-6">
          <div className="flex items-center justify-center pt-20">
            <div className="text-center">
              {/* bg-red-500 لا يتغير */}
              <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              {/* text-gray-600 -> dark:text-gray-300 */}
              <p className="text-gray-600 dark:text-gray-300">جاري تحميل المُفضلة...</p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-4 md:p-6">
        {/* Error State */}
        {error && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">⚠</div>
            {/* text-gray-800 -> dark:text-gray-100 */}
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">خطأ</h2>
            {/* text-gray-600 -> dark:text-gray-300 */}
            <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
            {/* bg-red-500, text-white, hover:bg-red-600 لا تتغير */}
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
            {/* text-gray-300 لا يتغير لأنه فاتح بالفعل */}
            <HeartOff className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            {/* text-gray-800 -> dark:text-gray-100 */}
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
              لا توجد منتجات مُفضلة
            </h2>
            {/* text-gray-600 -> dark:text-gray-300 */}
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              لم تقم بإضافة أي منتجات إلى المُفضلة بعد
            </p>
            {/* bg-red-500, text-white, hover:bg-red-600 لا تتغير */}
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
                  // bg-white -> dark:bg-gray-900
                  // shadow-sm, hover:shadow-lg -> dark:shadow-gray-900/50
                  // border-gray-100 -> dark:border-gray-800 (استخدمت 800 لـ gray-100)
                  className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-sm hover:shadow-lg dark:hover:shadow-gray-900/50 transition-all duration-200 border border-gray-100 dark:border-gray-800 group relative"
                >
                  {/* Remove Like Button */}
                  <button
                    onClick={() => handleRemoveLike(product.id, likeItem.id)}
                    disabled={removingLike === product.id}
                    className={`absolute top-3 left-3 z-10 w-8 h-8 rounded-full flex items-center justify-center shadow-md dark:shadow-gray-900/30 transition-all opacity-0 group-hover:opacity-100 ${
                      removingLike === product.id
                        ? "bg-gray-300 dark:bg-gray-700" // bg-gray-300 -> dark:bg-gray-700
                        : "bg-white dark:bg-gray-900 hover:bg-red-50 dark:hover:bg-red-900/20" // bg-white -> dark:bg-gray-900, hover:bg-red-50 -> dark:hover:bg-red-900/20 (اختياري)
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
                    // bg-gray-100 -> dark:bg-gray-800
                    className="relative w-full bg-gray-100 dark:bg-gray-800 cursor-pointer"
                    style={{ aspectRatio: "4/3" }}
                    onClick={() => router.push(`/product/${product.id}`)}
                  >
<Image
  src={product.image_urls?.[0] || "/placeholder-image.jpg"}
  alt={product.title}
  className="w-full h-full object-cover"
  onError={handleImageError}
  loading="lazy"
  width={500} // قم بتعديل هذا الرقم بناءً على التصميم
  height={300} // قم بتعديل هذا الرقم بناءً على التصميم
/>
                  </div>

                  {/* Product Info */}
                  <div
                    className="p-4 cursor-pointer"
                    onClick={() => router.push(`/product/${product.id}`)}
                  >
                    {/* text-gray-900 -> dark:text-white */}
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                      {product.title}
                    </h3>

                    <div className="text-lg font-bold text-green-600 mb-2">
                      {/* text-green-600 لا يتغير */}
                      {formatPrice(product.price)} {product.currency}
                    </div>

                    {/* text-gray-500 -> dark:text-gray-400 */}
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                      <MapPin className="w-4 h-4" />
                      <span>{product.location}</span>
                    </div>

                    {/* text-gray-400 لا يتغير لأنه فاتح بما فيه الكفاية */}
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(likeItem.created_at)}</span>
                      </div>
                      {/* bg-gray-100 -> dark:bg-gray-800 */}
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">
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
    </AppLayout>
  );
}