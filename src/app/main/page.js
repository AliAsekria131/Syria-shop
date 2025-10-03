// src/app/main/page.js
"use client";

import { createClient } from '../../../lib/supabase';
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Calendar } from "lucide-react";
import RemainingTime from "../components/RemainingTime";
import AppLayout from "../components/AppLayout";
import Image from 'next/image';

export default function MainPage() {
  const supabase = createClient();
  const router = useRouter();
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const channelRef = useRef(null);

  // جلب الإعلانات النشطة فقط مع الحقول المطلوبة
  const fetchAds = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("ads")
        .select(`
          id,
          title,
          price,
          currency,
          category,
          location,
          image_urls,
          created_at,
          expires_at
        `)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(100); // حد أقصى 100 إعلان

      if (fetchError) throw fetchError;
      
      setAds(data || []);
    } catch (err) {
      console.error("Error fetching ads:", err);
      setError("حدث خطأ في تحميل الإعلانات");
      setAds([]);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // إعداد Realtime Subscription
  useEffect(() => {
    // جلب البيانات الأولية
    fetchAds();

    // إعداد Realtime للتحديثات الفورية
    const setupRealtime = async () => {
      try {
        // إلغاء الاشتراك السابق إن وجد
        if (channelRef.current) {
          await supabase.removeChannel(channelRef.current);
        }

        // إنشاء اشتراك جديد
        const channel = supabase
          .channel('public:ads:status=eq.active')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'ads',
              filter: 'status=eq.active'
            },
            (payload) => {
              console.log('New ad inserted:', payload.new);
              setAds((prev) => [payload.new, ...prev].slice(0, 100)); // حد أقصى 100
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'ads'
            },
            (payload) => {
              console.log('Ad updated:', payload.new);
              
              // إذا تم تحديث الحالة إلى expired، احذفه من القائمة
              if (payload.new.status !== 'active') {
                setAds((prev) => prev.filter((ad) => ad.id !== payload.new.id));
              } else {
                // تحديث البيانات
                setAds((prev) =>
                  prev.map((ad) => (ad.id === payload.new.id ? payload.new : ad))
                );
              }
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'DELETE',
              schema: 'public',
              table: 'ads'
            },
            (payload) => {
              console.log('Ad deleted:', payload.old);
              setAds((prev) => prev.filter((ad) => ad.id !== payload.old.id));
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log('✅ Realtime connected');
            }
            if (status === 'CHANNEL_ERROR') {
              console.error('❌ Realtime error');
            }
          });

        channelRef.current = channel;
      } catch (err) {
        console.error('Realtime setup error:', err);
      }
    };

    setupRealtime();

    // Cleanup عند unmount
    return () => {
      const cleanup = async () => {
        if (channelRef.current) {
          await supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        }
      };
      cleanup();
    };
  }, [supabase, fetchAds]);

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

  const handleImageError = (e) => {
    e.target.src = "/placeholder-image.jpg";
    e.target.alt = "صورة غير متاحة";
  };

  if (error) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">{error}</h3>
            <button
              onClick={fetchAds}
              className="mt-4 bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors"
            >
              إعادة المحاولة
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-4 md:p-6">
        {loading ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">جاري تحميل المنتجات...</p>
          </div>
        ) : ads.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              لا توجد منتجات متاحة
            </h3>
            <p className="text-gray-500 mb-6">
              كن أول من يضيف منتجاً في هذا القسم
            </p>
            <button
              onClick={() => router.push("/add-product")}
              className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors font-medium"
            >
              أضف منتجك الآن
            </button>
          </div>
        ) : (
          <>
            {/* عداد الإعلانات */}
            <div className="mb-6 flex items-center justify-between">
              <div className="text-gray-600">
                <span className="font-semibold text-gray-900">{ads.length}</span> منتج نشط
              </div>
            </div>

            {/* شبكة المنتجات */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              {ads.map((product, index) => (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl overflow-hidden transition-all duration-200 cursor-pointer border border-gray-300 hover:shadow-lg hover:border-red-400"
                  onClick={() => router.push(`/product/${product.id}`)}
                >
                  <div className="relative p-2" style={{ aspectRatio: "1/1" }}>
                    <Image
                      src={product.image_urls?.[0] || "/placeholder-image.jpg"}
                      alt={product.title}
                      fill
                      className="object-contain rounded-xl"
                      onError={handleImageError}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 20vw"
                      priority={index < 8} // أول 8 صور
                      loading={index < 8 ? "eager" : "lazy"}
                    />
                    <div className="absolute top-4 right-4 bg-black bg-opacity-60 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm">
                      {product.category}
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[3rem]">
                      {product.title}
                    </h3>

                    <div className="mb-3">
                      <RemainingTime expiresAt={product.expires_at} />
                    </div>

                    <div className="flex items-center justify-between mb-3">
                      <span className="text-lg font-bold text-green-600">
                        {formatPrice(product.price)} {product.currency}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-1 flex-1 min-w-0">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{product.location}</span>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                        <Calendar className="w-3 h-3" />
                        <span className="whitespace-nowrap">
                          {formatDate(product.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}