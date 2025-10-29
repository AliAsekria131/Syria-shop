"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Search, Filter, MapPin, Calendar } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import UserProfileMenu from "@/components/UserProfileMenu";

const supabase = createClient();

// ======== دالة تنسيق مشتركة ========
const formatPrice = (price) => new Intl.NumberFormat("ar-SY").format(price);
const formatDate = (date) => new Date(date).toLocaleDateString("ar-SY", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

// ======== مكون قائمة منسدلة (Select) معاد استخدامه ========
function FilterSelect({ value, onChange, options, placeholder, label, className = "" }) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:border-red-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

// ======== مكون لوحة الفلاتر الموحد ========
function FilterPanel({ filters, setFilters, categories, locations, onClear, hasActiveFilters, isMobile }) {
  const containerClass = isMobile 
    ? "mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
    : "px-6 pb-4 border-b border-gray-200 dark:border-gray-700";

  return (
    <div className={containerClass}>
      <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} gap-4`}>
        <FilterSelect
          value={filters.category}
          onChange={(val) => setFilters((p) => ({ ...p, category: val }))}
          options={categories}
          placeholder="جميع الفئات"
          label={isMobile ? "الفئة" : null}
          className="flex-1"
        />

        <FilterSelect
          value={filters.location}
          onChange={(val) => setFilters((p) => ({ ...p, location: val }))}
          options={locations}
          placeholder="جميع المواقع"
          label={isMobile ? "الموقع" : null}
          className="flex-1"
        />

        {hasActiveFilters && !isMobile && (
          <button onClick={onClear} className="px-4 py-2 text-red-500 hover:text-red-600 font-medium">
            مسح الفلاتر
          </button>
        )}
      </div>
    </div>
  );
}

// ======== مكون بطاقة المنتج ========
function ProductCard({ product, onClick }) {
  const handleImageError = (e) => {
    e.target.src = "/placeholder-image.jpg";
  };

  return (
    <div
      className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden transition-all cursor-pointer border border-gray-300 dark:border-gray-600 hover:shadow-lg hover:border-red-400 dark:hover:border-red-500"
      onClick={onClick}
    >
      {/* صورة المنتج */}
      <div className="relative p-2 aspect-[7/6]">
        <Image
          src={product.image_urls?.[0] || "/placeholder-image.jpg"}
          alt={product.title}
          fill
          className="object-cover rounded-xl bg-gray-100 dark:bg-gray-800"
          onError={handleImageError}
          sizes="(max-width: 640px) 60vw, (max-width: 1024px) 50vw, 33vw"
          quality={75}
        />
        <div className="absolute top-4 right-4 bg-black/60 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm">
          {product.category}
        </div>
      </div>

      {/* معلومات المنتج */}
      <div className="p-4 space-y-2">
        {/* البائع */}
        <div className="flex items-center gap-2">
          <Image
            src={product.avatar_url || "/avatar.svg"}
            alt={product.full_name || "بائع"}
            width={28}
            height={28}
            className="rounded-full object-cover bg-gray-200 dark:bg-gray-700"
            onError={handleImageError}
          />
          <span className="truncate text-gray-900 dark:text-white">
            {product.full_name || "بائع مجهول"}
          </span>
        </div>

        {/* العنوان والسعر */}
        <div className="flex justify-between items-center gap-2">
          <h3 className="font-semibold text-lg text-gray-900 dark:text-white truncate flex-1">
            {product.title}
          </h3>
          <span className="text-lg font-bold text-gray-900 dark:text-white whitespace-nowrap">
            {formatPrice(product.price)} ل.س
          </span>
        </div>

        {/* الوصف */}
        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
          {product.description}
        </p>

        {/* الموقع والتاريخ */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-1 flex-1 min-w-0">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{product.location}</span>
          </div>
          <div className="flex items-center gap-1 ml-2">
            <Calendar className="w-3 h-3" />
            <span className="whitespace-nowrap">{formatDate(product.created_at)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ======== مكون حقل البحث ========
function SearchInput({ value, onChange, loading, isMobile }) {
  const inputClass = isMobile
    ? "w-full pr-12 pl-6 py-4 rounded-2xl"
    : "w-full pr-10 pl-4 py-2.5 rounded-lg text-sm";

  return (
    <div className="relative flex-1">
      <Search className={`absolute right-${isMobile ? '4' : '3'} top-1/2 transform -translate-y-1/2 text-gray-400 w-${isMobile ? '5' : '4'} h-${isMobile ? '5' : '4'}`} />
      <input
        type="text"
        placeholder="ابحث في المنتجات..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputClass} bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-white dark:focus:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 focus:outline-none text-gray-900 dark:text-white`}
      />
      {loading && (
        <div className={`absolute left-${isMobile ? '4' : '3'} top-1/2 transform -translate-y-1/2`}>
          <div className={`w-${isMobile ? '5' : '4'} h-${isMobile ? '5' : '4'} border-2 border-red-500 border-t-transparent rounded-full animate-spin`}></div>
        </div>
      )}
    </div>
  );
}

// ======== مكون شاشة فارغة ========
function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="text-center py-20">
      <Icon className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
      <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">{title}</h3>
      <p className="text-gray-500 dark:text-gray-400">{description}</p>
    </div>
  );
}

// ======== المكون الرئيسي ========
export default function SearchComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ======== جلب بيانات المستخدم مباشرة ========
  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setUserLoading(false);
      }
    };

    fetchUser();

    // الاستماع لتغييرات حالة المصادقة
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ======== الحالات ========
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: searchParams.get("category") || "",
    location: searchParams.get("location") || "",
  });
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);

  // ======== جلب الإعلانات ========
  const fetchAds = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);

      let query = supabase.rpc("get_all_ads");

      if (searchQuery.trim()) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }
      if (filters.category) query = query.eq("category", filters.category);
      if (filters.location) query = query.eq("location", filters.location);

      const { data, error } = await query;
      if (error) throw error;

      setAds(data || []);
    } catch (err) {
      console.error("Error fetching ads:", err);
      setAds([]);
    } finally {
      setLoading(false);
      setSearchLoading(false);
    }
  }, [searchQuery, filters]);

  // ======== جلب الفلاتر ========
  const fetchFilters = useCallback(async () => {
    try {
      const [{ data: categoryData }, { data: locationData }] = await Promise.all([
        supabase.from("ads").select("category").eq("status", "active"),
        supabase.from("ads").select("location").eq("status", "active"),
      ]);

      setCategories([...new Set(categoryData?.map((i) => i.category).filter(Boolean) || [])]);
      setLocations([...new Set(locationData?.map((i) => i.location).filter(Boolean) || [])]);
    } catch (error) {
      console.error("Error fetching filters:", error);
    }
  }, []);

  // ======== تسجيل الخروج ========
  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    router.replace("/auth");
  }, [router]);

  // ======== مسح الفلاتر ========
  const clearFilters = () => {
    setSearchQuery("");
    setFilters({ category: "", location: "" });
  };

  const hasActiveFilters = searchQuery || filters.category || filters.location;

  // ======== Effects ========
  useEffect(() => {
    fetchFilters();
  }, [fetchFilters]);

  useEffect(() => {
    if (searchQuery.length > 0 && searchQuery.length < 2) return;
    const timeoutId = setTimeout(() => {
      setSearchLoading(true);
      fetchAds(false);
    }, 800);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, fetchAds]);

  useEffect(() => {
    if (filters.category || filters.location) fetchAds(false);
  }, [filters, fetchAds]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (filters.category) params.set("category", filters.category);
    if (filters.location) params.set("location", filters.location);
    window.history.replaceState(null, "", params.toString() ? `/search?${params}` : "/search");
  }, [searchQuery, filters]);

  return (
    <AppLayout>
      {/* ======== Desktop Header ======== */}
      <div className="hidden md:block sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="px-3 py-2.5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2.5 rounded-lg transition-colors ${
                showFilters ? "bg-gray-900 dark:bg-gray-700 text-white" : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <Filter className="w-5 h-5" />
            </button>
            <SearchInput value={searchQuery} onChange={setSearchQuery} loading={searchLoading} />
            <UserProfileMenu user={user} onSignOut={handleSignOut} />
          </div>
        </div>
        {showFilters && (
          <FilterPanel
            filters={filters}
            setFilters={setFilters}
            categories={categories}
            locations={locations}
            onClear={clearFilters}
            hasActiveFilters={hasActiveFilters}
          />
        )}
      </div>

      {/* ======== Mobile Header ======== */}
      <div className="md:hidden sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 py-4">
          <div className="mb-4">
            <SearchInput value={searchQuery} onChange={setSearchQuery} loading={searchLoading} isMobile />
          </div>
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
                showFilters ? "bg-red-500 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              }`}
            >
              <Filter className="w-4 h-4" />
            </button>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-red-500 hover:text-red-600 font-medium">
                مسح الكل
              </button>
            )}
          </div>
          {showFilters && (
            <FilterPanel
              filters={filters}
              setFilters={setFilters}
              categories={categories}
              locations={locations}
              isMobile
            />
          )}
        </div>
      </div>

      {/* ======== النتائج ======== */}
      <div className="p-4 md:p-6">
        {loading ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">جاري البحث...</p>
          </div>
        ) : (
          <>
            {searchQuery && ads.length > 0 && (
              <p className="mb-4 text-gray-600 dark:text-gray-300">تم العثور على {ads.length} نتيجة</p>
            )}

            {ads.length === 0 && hasActiveFilters ? (
              <EmptyState
                icon={Search}
                title="لا توجد نتائج مطابقة"
                description="جرب تعديل معايير البحث أو مسح الفلاتر"
              />
            ) : ads.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {ads.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onClick={() => router.push(`/product/${product.id}`)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Search}
                title="ابحث عن المنتجات"
                description="أدخل كلمة البحث أو استخدم الفلاتر"
              />
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}