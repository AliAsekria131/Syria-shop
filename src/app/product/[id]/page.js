// product - id
"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useEffect, useState } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import { getCurrentUser } from "../../../utils/auth";
import { 
  Home, User, Plus, ChevronDown, LogOut, Settings, Share, Heart, X,
  ArrowLeft, MapPin, Calendar, Phone, Mail,
  Copy, MessageCircle, Send, Shield, Star, PlusCircle
} from 'lucide-react';

import Comments from "../../components/Comments";

// أولاً: أضف هذا الاستيراد في بداية الملف
import RemainingTime from "../../components/RemainingTime";
import { renewAd } from "../../../utils/renewAd";

export default function ProductDetailsPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const productId = params.id;

  // الحالات
  const [currentUser, setCurrentUser] = useState(null);
  const [product, setProduct] = useState(null);
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isOwner, setIsOwner] = useState(false);
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // حساب متوسط التقييم
  const [averageRating, setAverageRating] = useState(0);
  const [totalComments, setTotalComments] = useState(0);
  
  // ثانياً: أضف هذه الحالات الجديدة بعد الحالات الموجودة
const [renewLoading, setRenewLoading] = useState(false);


const [relatedProducts, setRelatedProducts] = useState([]);

// أضف هذه مع باقي الحالات
const [showMobileComments, setShowMobileComments] = useState(false);




  // إضافة مستمع للنقر خارج القائمة المنسدلة
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserMenu && !event.target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu]);

  useEffect(() => {
    if (currentUser && productId) {
      fetchProductRating();
    }
  }, [currentUser, productId]);

  const fetchProductRating = async () => {
    try {
      const { data, error } = await supabase
        .from("comments")
        .select("rating")
        .eq("product_id", productId);

      if (error) throw error;

      if (data && data.length > 0) {
        const total = data.reduce((sum, comment) => sum + comment.rating, 0);
        const average = total / data.length;
        setAverageRating(average);
        setTotalComments(data.length);
      }
    } catch (error) {
      console.error("Error fetching rating:", error);
    }
  };

  // التحقق من المصادقة وجلب المستخدم الحالي
  useEffect(() => {
    const checkAuth = async () => {
      const user = await getCurrentUser(supabase);
      if (!user) {
        router.push("/main");
        return;
      }

      // جلب بيانات الملف الشخصي
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setCurrentUser(userProfile || user);
    };

    checkAuth();
  }, [supabase, router]);

  // جلب تفاصيل المنتج والبائع
  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!currentUser || !productId) return;

      try {
        setLoading(true);
        setError("");
		

        // جلب تفاصيل المنتج
const { data: productData, error: productError } = await supabase
  .from("ads")
  .select("*")
  .eq("id", productId)
  .single();
  
  // التحقق من حالة الإعلان
if (productData) {
  const now = new Date();
  const expiresAt = new Date(productData.expires_at);
  
  // إذا انتهت صلاحية الإعلان ولكن حالته ما زالت active
  if (expiresAt < now && productData.status === 'active') {
    // تحديث حالة الإعلان إلى منتهي الصلاحية
    await supabase
      .from("ads")
      .update({ status: 'expired' })
      .eq("id", productId);
    
    productData.status = 'expired';
  }
  
  // إذا كان الإعلان منتهي الصلاحية وليس مالك الإعلان
  if (productData.status === 'expired' && productData.user_id !== currentUser.id) {
    throw new Error("هذا الإعلان منتهي الصلاحية وغير متاح حالياً");
  }
}

        if (productError) {
          throw new Error("المنتج غير موجود أو غير متاح");
        }

        setProduct(productData);

        // التحقق من كون المستخدم الحالي هو صاحب المنتج
        setIsOwner(productData.user_id === currentUser.id);

        // جلب معلومات البائع
        const { data: sellerData, error: sellerError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", productData.user_id)
          .single();

        if (sellerError) {
          console.warn("تعذر جلب معلومات البائع:", sellerError);
          // إنشاء بيانات افتراضية للبائع
          setSeller({
            id: productData.user_id,
            full_name: null,
            phone: null,
            email: null,
          });
        } else {
          setSeller(sellerData);
        }

// جلب المنتجات ذات الصلة
        let relatedData = [];
        
        // أولاً: جلب المنتجات من نفس التصنيف ونفس الموقع
        const { data: sameCategoryLocation } = await supabase
          .from("ads")
          .select("*")
          .eq("status", "active")
          .eq("category", productData.category)
          .eq("location", productData.location)
          .neq("id", productId)
          .limit(4);

        if (sameCategoryLocation) {
          relatedData = [...relatedData, ...sameCategoryLocation];
        }

        // إذا لم نحصل على منتجات كافية، جلب المزيد من نفس التصنيف (مواقع مختلفة)
        if (relatedData.length < 6) {
          const remainingLimit = 6 - relatedData.length;
          const { data: sameCategoryOnly } = await supabase
            .from("ads")
            .select("*")
            .eq("status", "active")
            .eq("category", productData.category)
            .neq("id", productId)
            .not("location", "eq", productData.location)
            .limit(remainingLimit);

          if (sameCategoryOnly) {
            relatedData = [...relatedData, ...sameCategoryOnly];
          }
        }

        // إذا ما زلنا نحتاج المزيد، جلب منتجات من نفس الموقع (تصنيفات مختلفة)
        if (relatedData.length < 6) {
          const remainingLimit = 6 - relatedData.length;
          const { data: sameLocationOnly } = await supabase
            .from("ads")
            .select("*")
            .eq("status", "active")
            .eq("location", productData.location)
            .neq("id", productId)
            .not("category", "eq", productData.category)
            .limit(remainingLimit);

          if (sameLocationOnly) {
            relatedData = [...relatedData, ...sameLocationOnly];
          }
        }

        setRelatedProducts(relatedData || []);
		
      } catch (err) {
        console.error("Error fetching product details:", err);
        setError(err.message || "حدث خطأ في تحميل تفاصيل المنتج");
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [currentUser, productId, supabase]);


// ثالثاً: أضف هذه الدالة قبل دالة handleLogout
const handleRenewAd = async () => {
  if (!confirm("هل تريد تجديد هذا الإعلان لـ 7 أيام إضافية؟")) {
    return;
  }

  try {
    setRenewLoading(true);
    const result = await renewAd(productId);
    
    if (result.success) {
      alert("✅ تم تجديد الإعلان بنجاح!");
      // إعادة تحميل بيانات المنتج لعرض الوقت الجديد
      window.location.reload();
    } else {
      alert("❌ " + result.message);
    }
  } catch (error) {
    console.error("خطأ في تجديد الإعلان:", error);
    alert("❌ حدث خطأ في تجديد الإعلان");
  } finally {
    setRenewLoading(false);
  }
};


  // دالة تسجيل الخروج
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
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // دالة معالجة الصور المكسورة
  const handleImageError = (e) => {
    e.target.src = "/placeholder-image.jpg";
    e.target.alt = "صورة غير متاحة";
  };

  // دالة التنقل بين الصور
  const goToImage = (index) => {
    setCurrentImageIndex(index);
  };

  const goToPreviousImage = () => {
    if (product?.image_urls?.length > 1) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? product.image_urls.length - 1 : prev - 1
      );
    }
  };

  const goToNextImage = () => {
    if (product?.image_urls?.length > 1) {
      setCurrentImageIndex((prev) =>
        prev === product.image_urls.length - 1 ? 0 : prev + 1
      );
    }
  };

  // دالة نسخ رقم الهاتف
  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text).then(() => {
      alert(`تم نسخ ${type} بنجاح!`);
    });
  };

  // دالة فتح تطبيق خارجي
  const openExternalApp = (type, value) => {
    let url = "";
    switch (type) {
      case "whatsapp":
        url = `https://wa.me/963${value.replace(/\D/g, "")}`;
        break;
      case "telegram":
        url = `https://t.me/+963${value.replace(/\D/g, "")}`;
        break;
      case "phone":
        url = `tel:${value}`;
        break;
      case "email":
        url = `mailto:${value}`;
        break;
      default:
        return;
    }
    window.open(url, "_blank");
  };

  // شاشة التحميل
  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#F0F2F5' }}>
        <div className="flex items-center justify-center pt-20">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
                 style={{ borderColor: '#1877F2', borderTopColor: 'transparent' }}></div>
            <p className="text-gray-600">جاري تحميل تفاصيل المنتج...</p>
          </div>
        </div>
      </div>
    );
  }

  // عرض الخطأ
  if (error) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#F0F2F5' }}>
        <div className="flex items-center justify-center pt-20">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">خطأ</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => router.back()}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                العودة
              </button>
              <button
                onClick={() => router.push("/main")}
                className="px-4 py-2 text-white rounded-lg hover:opacity-90"
                style={{ backgroundColor: '#1877F2' }}
              >
                الصفحة الرئيسية
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#F0F2F5' }}>
        <div className="flex items-center justify-center pt-20">
          <div className="text-center">
            <p className="text-gray-600">المنتج غير موجود</p>
          </div>
        </div>
      </div>
    );
  }

// استبدل الجزء من بداية return حتى نهاية div الرئيسي في ملف product/[id]/page.js
return (
  <div className="min-h-screen bg-white" dir="rtl" lang="ar">
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
        <button
          onClick={() => router.push("/settings")}
          className="p-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          title="الإعدادات"
        >
          <Settings className="w-6 h-6" />
        </button>
      </div>
    </div>

    {/* Main Content */}
    <div className="md:mr-20">
      {/* Top Bar - Desktop */}
      <div className="hidden md:block sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center gap-4">
            {/* Back Button */}
            <button
              onClick={() => router.back()}
              className="p-3 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
              title="العودة"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>

            {/* Title */}
            <h1 className="text-xl font-semibold text-gray-900 flex-1">
              تفاصيل المنتج
            </h1>

            {/* User Menu */}
            <div className="relative user-menu-container">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <img
                  src={currentUser?.avatar_url || "/avatar.svg"}
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
                    onClick={() => {
                      router.push("/dashboard");
                      setShowUserMenu(false);
                    }}
                    className="w-full px-4 py-3 text-right hover:bg-gray-50 transition-colors flex items-center gap-3"
                  >
                    <User className="w-5 h-5 text-gray-500" />
                    <span>الملف الشخصي</span>
                  </button>
                  <hr className="my-1" />
                  <button
                    onClick={async () => {
                      if (window.confirm("هل أنت متأكد من تسجيل الخروج؟")) {
                        await supabase.auth.signOut();
                        router.push("/");
                      }
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

      {/* Products Content Area */}
      <div className="p-4 md:p-6">
        {loading && (
          <div className="text-center py-20">
            <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">جاري تحميل تفاصيل المنتج...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">خطأ</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => router.push("/main")}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              العودة للرئيسية
            </button>
          </div>
        )}

        {!loading && !error && product && seller && (
          <>
            {/* Desktop Layout */}
            <div className="hidden md:block">
              <div className="flex gap-6">
                {/* Left Side - Main Product Card */}
                <div className="w-1/2">
                  <div className="bg-white rounded-3xl overflow-hidden border border-gray-300 sticky top-24">
                    {/* Image Container */}
                    <div className="relative group">
                      <img
                        src={product.image_urls?.[0] || "/placeholder-image.jpg"}
                        alt={product.title}
                        className="w-full object-cover"
                        style={{ aspectRatio: "4/3" }}
                        onError={handleImageError}
                      />
                      
                      {/* Overlay Buttons - Desktop */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300">
                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-gray-50">
                            <MessageCircle className="w-5 h-5 text-gray-700" />
                          </button>
                          <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-gray-50">
                            <Share className="w-5 h-5 text-gray-700" />
                          </button>
                          <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-gray-50">
                            <Heart className="w-5 h-5 text-gray-700" />
                          </button>
                        </div>

                        {/* Navigation Arrows */}
                        {product.image_urls?.length > 1 && (
                          <>
                            <button className="absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white bg-opacity-80 rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <ArrowLeft className="w-5 h-5 text-gray-700" />
                            </button>
                            <button className="absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white bg-opacity-80 rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <ArrowLeft className="w-5 h-5 text-gray-700 rotate-180" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
					
                    {/* Product Info */}
                    <div className="p-6">
                      {/* Title */}
                      <h1 className="text-xl font-bold text-gray-900 mb-4">
                        {product.title}
                      </h1>
                      
                      {/* Horizontal Info Layout */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-2xl font-bold text-green-600">
                          {formatPrice(product.price)} {product.currency}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <MapPin className="w-4 h-4" />
                          <span>{product.location}</span>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-gray-600 text-sm leading-relaxed mb-4">
                        {product.description}
                      </p>
					  
					  {/* Seller Info */}
                      <div className="flex items-center gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
                        <img
                          src={seller?.avatar_url || "/avatar.svg"}
                          alt="البائع"
                          className="w-8 h-8 rounded-full object-cover bg-gray-100"
                          onError={(e) => { e.target.src = "/avatar.svg"; }}
                        />
                        <div>
                          <div className="text-sm font-semibold text-gray-900">
                            {seller?.full_name || "البائع"}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatDate(product.created_at)}
                          </div>
                        </div>
                      </div>
					  
					  {/* Additional Info */}
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(product.created_at)}
                        </span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {product.category}
                        </span>
                      </div>

                      {/* Comments Section */}
                      <Comments 
                        productId={productId}
                        currentUser={currentUser}
                        supabase={supabase}
                        isOwner={isOwner}
                      />
                    </div>
                  </div>
                </div>

                {/* Right Side - Similar Products */}
                <div className="w-1/2">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {/* Top Two Cards */}
                    {relatedProducts.slice(0, 2).map((relatedProduct) => (
                      <div key={relatedProduct.id} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 cursor-pointer"
                           onClick={() => router.push(`/product/${relatedProduct.id}`)}>
                        <div className="relative group">
                          <img
                            src={relatedProduct.image_urls?.[0] || "/placeholder-image.jpg"}
                            alt={relatedProduct.title}
                            className="w-full object-cover aspect-square"
                            onError={handleImageError}
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300"></div>
                        </div>
                        <div className="p-3">
                          <h3 className="font-medium text-sm text-gray-900 mb-1 line-clamp-2">
                            {relatedProduct.title}
                          </h3>
                          <div className="text-sm font-bold text-green-600">
                            {formatPrice(relatedProduct.price)} {relatedProduct.currency}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Bottom Cards - Masonry Layout */}
                  <div className="columns-2 gap-4 space-y-4">
                    {relatedProducts.slice(2).map((relatedProduct) => (
                      <div key={relatedProduct.id} className="break-inside-avoid bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 cursor-pointer"
                           onClick={() => router.push(`/product/${relatedProduct.id}`)}>
                        <div className="relative group">
                          <img
                            src={relatedProduct.image_urls?.[0] || "/placeholder-image.jpg"}
                            alt={relatedProduct.title}
                            className="w-full object-cover"
                            style={{ aspectRatio: "auto" }}
                            onError={handleImageError}
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300"></div>
                        </div>
                        <div className="p-3">
                          <h3 className="font-medium text-sm text-gray-900 mb-1 line-clamp-2">
                            {relatedProduct.title}
                          </h3>
                          <div className="text-sm font-bold text-green-600">
                            {formatPrice(relatedProduct.price)} {relatedProduct.currency}
                          </div>
                        </div>
                      </div>
                    ))}
                  
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Layout */}
            <div className="md:hidden">
              {/* Main Product Card */}
              <div className="bg-white rounded-3xl overflow-hidden shadow-lg border border-gray-100 mb-6">
                {/* Image */}
                <div className="relative">
                  <img
                    src={product.image_urls?.[0] || "/placeholder-image.jpg"}
                    alt={product.title}
                    className="w-full object-cover"
                    style={{ aspectRatio: "4/5" }}
                    onError={handleImageError}
                  />
                  
                  {/* Navigation Button */}
                  {product.image_urls?.length > 1 && (
                    <button className="absolute top-4 left-4 w-10 h-10 bg-white bg-opacity-80 rounded-full flex items-center justify-center shadow-md">
                      <ArrowLeft className="w-5 h-5 text-gray-700 rotate-180" />
                    </button>
                  )}
                </div>

                {/* Mobile Action Buttons */}
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <button className="bg-red-500 text-white px-6 py-2 rounded-full font-medium">
                      حفظ
                    </button>
                    <div className="flex gap-3">
                      <button className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center">
                        <Share className="w-5 h-5 text-gray-600" />
                      </button>
                      <button 
                        onClick={() => setShowMobileComments(true)}
                        className="flex items-center gap-1 px-3 py-2 rounded-full border border-gray-300"
                      >
                        <MessageCircle className="w-5 h-5 text-gray-600" />
                        <span className="text-sm">التعليقات</span>
                      </button>
					  
                      <button className="flex items-center gap-1 px-3 py-2 rounded-full border border-gray-300">
                        <Heart className="w-5 h-5 text-gray-600" />
                        <span className="text-sm">79</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <img
                      src={seller?.avatar_url || "/avatar.svg"}
                      alt="البائع"
                      className="w-8 h-8 rounded-full object-cover bg-gray-100"
                    />
                    <div>
                      <div className="text-sm font-semibold text-gray-900">
                        {seller?.full_name || "البائع"}
                      </div>
                    </div>
                  </div>

                  <h1 className="text-xl font-bold text-gray-900 mb-3">
                    {product.title}
                  </h1>

                  <div className="text-2xl font-bold text-green-600 mb-3">
                    {formatPrice(product.price)} {product.currency}
                  </div>

                  <p className="text-gray-600 text-sm leading-relaxed mb-4">
                    {product.description}
                  </p>

                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <MapPin className="w-4 h-4" />
                    <span>{product.location}</span>
                  </div>
                </div>
              </div>

			{/* Related Products Grid */}
              <div className="grid grid-cols-2 gap-2">
                {relatedProducts.slice(0, 4).map((relatedProduct) => (
                  <div key={relatedProduct.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer"
                       onClick={() => router.push(`/product/${relatedProduct.id}`)}>
                    <img
                      src={relatedProduct.image_urls?.[0] || "/placeholder-image.jpg"}
                      alt={relatedProduct.title}
                      className="w-full object-cover aspect-square"
                      onError={handleImageError}
                    />
                    <div className="p-3">
                      <h3 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-2">
                        {relatedProduct.title}
                      </h3>
                      <div className="text-sm font-bold text-green-600">
                        {formatPrice(relatedProduct.price)} {relatedProduct.currency}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile Comments Modal */}
            {showMobileComments && (
              <Comments 
                productId={productId}
                currentUser={currentUser}
                supabase={supabase}
                isOwner={isOwner}
                showMobile={true}
                onClose={() => setShowMobileComments(false)}
              />
            )}
          </>
        )}
      </div>
    </div>

    {/* Mobile Bottom Navigation */}
    <div
      className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50"
      style={{ height: "70px" }}
    >
      <div className="flex items-center justify-around h-full">
        <button
          onClick={() => router.push("/main")}
          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
            pathname === "/main" ? "text-red-500" : "text-gray-600"
          }`}
        >
          <Home className="w-5 h-5" />
        </button>

        <button
          onClick={() => router.back()}
          className="flex flex-col items-center gap-1 p-2 rounded-lg text-gray-600"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <button
          onClick={() => router.push("/add-product")}
          className="flex flex-col items-center gap-1 p-2 rounded-lg text-red-500"
        >
          <PlusCircle className="w-5 h-5" />
        </button>

        <button
          onClick={() => router.push("/messages")}
          className="flex flex-col items-center gap-1 p-2 rounded-lg text-gray-600"
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