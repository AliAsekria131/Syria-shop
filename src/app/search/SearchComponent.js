// src/app/search/SearchComponent.js
"use client";

import { createClient } from "@/lib/supabase";
import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Search, Filter, MapPin, Calendar } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import UserProfileMenu from "@/components/UserProfileMenu";
import { useUser } from "@/hooks/useUser";

const supabase = createClient();

function FilterPanel({
  filters,
  setFilters,
  categories,
  locations,
  onClear,
  hasActiveFilters,
}) {
  return (
    <div className="px-6 pb-4 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-4">
        <select
          value={filters.category}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, category: e.target.value }))
          }
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:border-red-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="">جميع الفئات</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>

        <select
          value={filters.location}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, location: e.target.value }))
          }
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:border-red-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="">جميع المواقع</option>
          {locations.map((location) => (
            <option key={location} value={location}>
              {location}
            </option>
          ))}
        </select>

        {hasActiveFilters && (
          <button
            onClick={onClear}
            className="px-4 py-2 text-red-500 hover:text-red-600 font-medium"
          >
            مسح الفلاتر
          </button>
        )}
      </div>
    </div>
  );
}

function MobileFilterPanel({
  filters,
  setFilters,
  categories,
  locations,
  show,
}) {
  if (!show) return null;

  return (
    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            الفئة
          </label>
          <select
            value={filters.category}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, category: e.target.value }))
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">جميع الفئات</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            الموقع
          </label>
          <select
            value={filters.location}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, location: e.target.value }))
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">جميع المواقع</option>
            {locations.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

function ProductCard({ product }) {
  const formatPrice = (price) => new Intl.NumberFormat("ar-SY").format(price);
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("ar-SY", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const router = useRouter();
  const handleImageError = (e) => {
    e.target.src = "/placeholder-image.jpg";
    e.target.alt = "صورة غير متاحة";
  };
  
  return (
    <div
      key={product.id}
      className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden transition-all duration-200 cursor-pointer border border-gray-300 dark:border-gray-600 hover:shadow-lg dark:hover:shadow-gray-900/50 hover:border-red-400 dark:hover:border-red-500 flex flex-col"
      onClick={() => router.push(`/product/${product.id}`)}
    >
      <div className="relative p-2" style={{ aspectRatio: "7/6" }}>
        <Image
          src={product.image_urls?.[0] || "/placeholder-image.jpg"}
          alt={product.title}
          fill
          className="object-cover rounded-xl bg-gray-100 dark:bg-gray-800"
          onError={handleImageError}
          sizes="(max-width: 640px) 60vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 20vw"
          quality={75}
        />
        <div className="absolute top-4 right-4 bg-black/60 dark:bg-black/70 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm">
          {product.category}
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center mb-2">
          <Image
            src={product.avatar_url || "/avatar.svg"}
            alt={product.full_name || "بائع مجهول"}
            width={20}
            height={20}
            className="w-7 h-7 rounded-full object-cover bg-gray-200 dark:bg-gray-700"
            onError={handleImageError}
            loading="lazy"
          />
          <span className="mr-2 truncate max-w-[120px] text-gray-900 dark:text-white">
            {product.full_name || "بائع مجهول"}
          </span>
        </div>

        <div className="mb-2 flex flex-row flex-wrap justify-between items-center">
          <div className="font-semibold text-lg overflow-hidden text-ellipsis text-gray-900 dark:text-white">
            {product.title}
          </div>
          <div className="flex items-center justify-between text-sm font-medium ml-2">
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              {formatPrice(product.price)} ل.س
            </span>
          </div>
        </div>

        <div className="text-sm text-gray-500 dark:text-gray-400 overflow-hidden text-ellipsis">
          {product.description}
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-100 dark:border-gray-700 mt-auto">
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
  );
}

export default function SearchComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDesktopFilters, setShowDesktopFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: searchParams.get("category") || "",
    location: searchParams.get("location") || "",
  });
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);

  const { user, loading: isLoading, error: authError } = useUser();

  const fetchAds = useCallback(
    async (showLoading = true) => {
      try {
        if (showLoading) setLoading(true);

        let query = supabase.rpc("get_all_ads"); 

        if (searchQuery.trim()) {
          query = query.or(
            `title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`
          );
        }

        if (filters.category) {
          query = query.eq("category", filters.category);
        }

        if (filters.location) {
          query = query.eq("location", filters.location);
        }

        const {data,error} = await query;
        if (error) throw error;

        setAds(data || []);
      } catch (err) {
        console.error("Error fetching ads:", err);
        setAds([]);
      } finally {
        setLoading(false);
        setSearchLoading(false);
      }
    },
    [searchQuery, filters]
  );

  const handleSignOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      router.replace("/auth");
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error("Sign out error:", err);
      }
    }
  }, [router]);

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
  }, []);

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
    if (filters.category || filters.location) {
      fetchAds(false);
    }
  }, [filters, fetchAds]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (filters.category) params.set("category", filters.category);
    if (filters.location) params.set("location", filters.location);

    const newURL = params.toString()
      ? `/search?${params.toString()}`
      : "/search";
    window.history.replaceState(null, "", newURL);
  }, [searchQuery, filters]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      fetchAds(true);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setFilters({ category: "", location: "" });
  };

  const hasActiveFilters = () => {
    return searchQuery || filters.category || filters.location;
  };

  return (
    <AppLayout>
      {/* Desktop Header Extension */}
      <div className="hidden md:block sticky top-[0px] z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="px-3 py-2.5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowDesktopFilters(!showDesktopFilters)}
              className={`p-2.5 rounded-lg transition-colors ${
                showDesktopFilters
                  ? "bg-gray-900 dark:bg-gray-700 text-white"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <Filter className="w-5 h-5" />
            </button>

            <form onSubmit={handleSearch} className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
              <input
                type="text"
                placeholder="ابحث في المنتجات..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-4 py-2.5 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-white dark:focus:bg-gray-800 transition-colors rounded-lg border-2 border-gray-200 dark:border-gray-600 focus:outline-none text-sm text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                autoFocus
              />
              {searchLoading && (
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </form>
            {/* user menu */}
            <UserProfileMenu user={user} onSignOut={handleSignOut} />
          </div>
        </div>

        {showDesktopFilters && (
          <FilterPanel
            filters={filters}
            setFilters={setFilters}
            categories={categories}
            locations={locations}
            onClear={clearFilters}
            hasActiveFilters={hasActiveFilters()}
          />
        )}
      </div>

      {/* Mobile Header */}
      <div className="md:hidden sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 py-4">
          <form onSubmit={handleSearch} className="mb-4">
            <div className="relative">
              <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
              <input
                type="text"
                placeholder="ابحث في المنتجات..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-12 pl-6 py-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-white dark:focus:bg-gray-800 transition-colors rounded-2xl border-2 border-gray-200 dark:border-gray-600 focus:outline-none text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                autoFocus
              />
              {searchLoading && (
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
          </form>

          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowDesktopFilters(!showDesktopFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
                showDesktopFilters
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              <Filter className="w-4 h-4" />
            </button>

            {hasActiveFilters() && (
              <button
                onClick={clearFilters}
                className="text-red-500 hover:text-red-600 font-medium"
              >
                مسح الكل
              </button>
            )}
          </div>

          <MobileFilterPanel
            filters={filters}
            setFilters={setFilters}
            categories={categories}
            locations={locations}
            show={showDesktopFilters}
          />
        </div>
      </div>

      {/* Results */}
      <div className="p-4 md:p-6">
        {loading ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">جاري البحث...</p>
          </div>
        ) : (
          <>
            {searchQuery && (
              <div className="mb-4">
                <p className="text-gray-600 dark:text-gray-300">
                  {ads.length > 0
                    ? `تم العثور على ${ads.length} نتيجة للبحث عن "${searchQuery}"`
                    : `لا توجد نتائج للبحث عن "${searchQuery}"`}
                </p>
              </div>
            )}

            {ads.length === 0 && hasActiveFilters() ? (
              <div className="text-center py-20">
                <Search className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  لا توجد نتائج مطابقة
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  جرب تعديل معايير البحث أو مسح الفلاتر
                </p>
              </div>
            ) : ads.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {ads.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <Search className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  ابحث عن المنتجات
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  أدخل كلمة البحث أو استخدم الفلاتر للعثور على ما تبحث عنه
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}