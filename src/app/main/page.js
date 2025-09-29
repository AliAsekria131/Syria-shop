// main page
"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Calendar } from "lucide-react";
import { useExpiredAdsChecker } from "../../utils/checkExpiredAds";
import RemainingTime from "../components/RemainingTime";
import AppLayout from "../components/AppLayout";

export default function MainPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  // الحالات
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);

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

  // دالة جلب البيانات مع الفلاتر
  const fetchAds = useCallback(
    async (showLoading = true) => {
      try {
        if (showLoading) setLoading(true);
        setError("");

        // الحصول على المستخدم الحالي
        const {
          data: { user },
        } = await supabase.auth.getUser();

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
    [supabase, filters]
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
    fetchAds(true);
    fetchFilters();
  }, [fetchAds, fetchFilters]);

  // مراقبة تغيير الفلاتر
  useEffect(() => {
    fetchAds(false);
  }, [filters, fetchAds]);

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

  return (
    <AppLayout>
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
                className="p-2 bg-white rounded-2xl overflow-hidden transition-all duration-200 cursor-pointer border border-gray-300"
                onClick={() => router.push(`/product/${product.id}`)}
              >
                <div className="relative">
                  <div
                    className="relative w-full bg-gray-100 rounded-2xl flex items-center justify-center "
                    style={{ aspectRatio: "1/1" }}
                  >
                    <img
                      src={
                        product.image_urls?.[0] || "/placeholder-image.jpg"
                      }
                      alt={product.title}
                      className="max-w-full max-h-full object-contain rounded-xl"
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
    </AppLayout>
  );
}