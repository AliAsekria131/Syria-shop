// product/[id]/page.js
"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Share,
  Heart,
  MessageCircle,
} from "lucide-react";

import Comments from "../../components/Comments";
import ContactButton from '../../components/ContactButton';
import RemainingTime from "../../components/RemainingTime";
import AppLayout from "../../components/AppLayout";
import { renewAd } from "../../../utils/renewAd";
import {
  addLike,
  removeLike,
  checkLike,
  getLikesCount,
} from "../../../utils/likes";

export default function ProductDetailsPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();
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
  const [averageRating, setAverageRating] = useState(0);
  const [totalComments, setTotalComments] = useState(0);
  const [renewLoading, setRenewLoading] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [showMobileComments, setShowMobileComments] = useState(false);

  // الحالات الخاصة بالإعجابات
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);

  // التحقق من صحة رابط الصورة
  const isValidImageUrl = (url) => {
    if (!url) return false;
    if (url.includes("placeholder-image.jpg")) return true;
    const validExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
    return validExtensions.some((ext) => url.toLowerCase().includes(ext));
  };

  // التحقق من المصادقة وجلب المستخدم الحالي
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/main");
        return;
      }

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

          if (expiresAt < now && productData.status === "active") {
            await supabase
              .from("ads")
              .update({ status: "expired" })
              .eq("id", productId);

            productData.status = "expired";
          }

          if (
            productData.status === "expired" &&
            productData.user_id !== currentUser.id
          ) {
            throw new Error("هذا الإعلان منتهي الصلاحية وغير متاح حالياً");
          }
        }

        if (productError) {
          throw new Error("المنتج غير موجود أو غير متاح");
        }

        setProduct(productData);
        setIsOwner(productData.user_id === currentUser.id);

        // جلب معلومات البائع
        const { data: sellerData, error: sellerError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", productData.user_id)
          .single();

        if (sellerError) {
          console.warn("تعذر جلب معلومات البائع:", sellerError);
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

  // جلب حالة الإعجاب
  useEffect(() => {
    const fetchLikeStatus = async () => {
      if (!currentUser || !productId) return;

      try {
        const likeResult = await checkLike(currentUser.id, productId);
        if (likeResult.success) {
          setIsLiked(likeResult.liked);
        }

        const countResult = await getLikesCount(productId);
        if (countResult.success) {
          setLikesCount(countResult.count);
        }
      } catch (error) {
        console.error("خطأ في جلب حالة الإعجاب:", error);
      }
    };

    if (product && currentUser) {
      fetchLikeStatus();
    }
  }, [currentUser, productId, product]);

  // دالة تجديد الإعلان
  const handleRenewAd = async () => {
    if (!confirm("هل تريد تجديد هذا الإعلان لـ 7 أيام إضافية؟")) {
      return;
    }

    try {
      setRenewLoading(true);
      const result = await renewAd(productId);

      if (result.success) {
        alert("✅ تم تجديد الإعلان بنجاح!");
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

  // دالة التعامل مع الإعجاب
  const handleLike = async () => {
    if (!currentUser) {
      alert("يرجى تسجيل الدخول أولاً");
      return;
    }

    if (likeLoading) return;

    try {
      setLikeLoading(true);

      if (isLiked) {
        const result = await removeLike(currentUser.id, productId);
        if (result.success) {
          setIsLiked(false);
          setLikesCount((prev) => Math.max(0, prev - 1));
        } else {
          alert("حدث خطأ في إزالة الإعجاب");
        }
      } else {
        const result = await addLike(currentUser.id, productId);
        if (result.success) {
          setIsLiked(true);
          setLikesCount((prev) => prev + 1);
        } else {
          alert("حدث خطأ في إضافة الإعجاب");
        }
      }
    } catch (error) {
      console.error("خطأ في التعامل مع الإعجاب:", error);
      alert("حدث خطأ، يرجى المحاولة مرة أخرى");
    } finally {
      setLikeLoading(false);
    }
  };

  // دوال التنسيق
  const formatPrice = (price) => {
    return new Intl.NumberFormat("ar-SY").format(price);
  };

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

  const handleImageError = (e) => {
    console.log("❌ Image failed:", e.target.src);

    if (e.target.src.includes("/placeholder-image.jpg")) {
      return;
    }

    e.target.style.display = "block";
    e.target.style.minHeight = "192px";
    e.target.style.backgroundColor = "#f3f4f6";
    e.target.src = "/placeholder-image.jpg";
    e.target.alt = "صورة غير متاحة";
  };

  // دوال التنقل بين الصور
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

  // دوال النسخ والفتح
  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text).then(() => {
      alert(`تم نسخ ${type} بنجاح!`);
    });
  };

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
      <AppLayout>
        <div className="flex items-center justify-center pt-20">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4 border-blue-500"></div>
            <p className="text-gray-600">جاري تحميل تفاصيل المنتج...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  // عرض الخطأ
  if (error) {
    return (
      <AppLayout>
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
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                الصفحة الرئيسية
              </button>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!product) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center pt-20">
          <div className="text-center">
            <p className="text-gray-600">المنتج غير موجود</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-4 md:p-6">
        {/* Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 pb-3 border-b-2 border-gray-200">
            تفاصيل المنتج
          </h1>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:block">
          <div className="flex gap-6">
            {/* Left Side - Main Product Card */}
            <div className="w-1/2">
              <div className="bg-white rounded-3xl overflow-hidden border border-gray-300 sticky top-24">
                {/* Image Container */}
                <div className="relative group p-4">
                  <div
                    className="relative w-full bg-gray-100 rounded-2xl flex items-center justify-center p-4"
                    style={{ aspectRatio: "4/3" }}
                  >
                    <img
                      src={
                        product.image_urls?.[0] || "/placeholder-image.jpg"
                      }
                      alt={product.title}
                      className="max-w-full max-h-full object-contain"
                      onError={handleImageError}
                      loading="lazy"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="absolute top-6 right-6 flex flex-col gap-2">
                    <button
                      onClick={() =>
                        document
                          .getElementById("comments-section")
                          ?.scrollIntoView({ behavior: "smooth" })
                      }
                      className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110"
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.9)",
                        backdropFilter: "blur(4px)",
                      }}
                    >
                      <MessageCircle className="w-5 h-5 text-gray-700" />
                    </button>
                    <button
                      className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110"
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.9)",
                        backdropFilter: "blur(4px)",
                      }}
                    >
                      <Share className="w-5 h-5 text-gray-700" />
                    </button>
                    <button
                      onClick={handleLike}
                      disabled={likeLoading}
                      className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 ${
                        likeLoading ? "opacity-50" : ""
                      }`}
                      style={{
                        backgroundColor: isLiked
                          ? "rgba(239, 68, 68, 0.9)"
                          : "rgba(255, 255, 255, 0.9)",
                        backdropFilter: "blur(4px)",
                      }}
                    >
                      <Heart
                        className={`w-5 h-5 ${
                          isLiked
                            ? "text-white fill-current"
                            : "text-gray-700"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Navigation Arrows */}
                  {product.image_urls?.length > 1 && (
                    <>
                      <button
                        className="absolute left-6 top-1/2 transform -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        style={{
                          backgroundColor: "rgba(255, 255, 255, 0.8)",
                        }}
                      >
                        <ArrowLeft className="w-5 h-5 text-gray-700" />
                      </button>
                      <button
                        className="absolute right-6 top-1/2 transform -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        style={{
                          backgroundColor: "rgba(255, 255, 255, 0.8)",
                        }}
                      >
                        <ArrowLeft className="w-5 h-5 text-gray-700 rotate-180" />
                      </button>
                    </>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-6">
                  {/* Contact Buttons */}
                  <div className="contact-buttons flex gap-2 mb-4">
                    {seller.phone && (
                      <>
                        <ContactButton type="whatsapp" value={seller.phone} />
                        <ContactButton type="phone" value={seller.phone} />
                        <ContactButton type="telegram" value={seller.phone} />
                      </>
                    )}
                    {seller.email && (
                      <ContactButton type="email" value={seller.email} />
                    )}
                  </div>

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
                      onError={(e) => {
                        e.target.src = "/avatar.svg";
                      }}
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
                  <div id="comments-section">
                    <Comments
                      productId={productId}
                      currentUser={currentUser}
                      supabase={supabase}
                      isOwner={isOwner}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Similar Products */}
            <div className="w-1/2">
              <div className="grid grid-cols-2 gap-4">
                {relatedProducts.slice(0, 6).map((relatedProduct) => (
                  <div
                    key={relatedProduct.id}
                    className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 cursor-pointer"
                    onClick={() =>
                      router.push(`/product/${relatedProduct.id}`)
                    }
                  >
                    <div
                      className="relative w-full bg-gray-100 flex items-center justify-center p-2"
                      style={{ aspectRatio: "1/1" }}
                    >
                      <img
                        src={
                          relatedProduct.image_urls?.[0] ||
                          "/placeholder-image.jpg"
                        }
                        alt={relatedProduct.title}
                        className="max-w-full max-h-full object-contain"
                        onError={handleImageError}
                      />
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium text-sm text-gray-900 mb-1 line-clamp-2">
                        {relatedProduct.title}
                      </h3>
                      <div className="text-sm font-bold text-green-600">
                        {formatPrice(relatedProduct.price)}{" "}
                        {relatedProduct.currency}
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
          <div className="bg-white rounded-3xl overflow-hidden border border-gray-300 mb-6">
            {/* Image */}
            <div className="relative p-3">
              <div className="relative w-full h-60 bg-gray-100 rounded-2xl flex items-center justify-center p-4">
                <img
                  src={product.image_urls?.[0] || "/placeholder-image.jpg"}
                  alt={product.title}
                  className="max-w-full max-h-full object-contain"
                  onError={handleImageError}
                />
              </div>

              {/* Navigation Button */}
              {product.image_urls?.length > 1 && (
                <button className="absolute top-6 left-6 w-10 h-10 bg-white bg-opacity-80 rounded-full flex items-center justify-center shadow-md">
                  <ArrowLeft className="w-5 h-5 text-gray-700 rotate-180" />
                </button>
              )}
            </div>

            {/* Mobile Action Buttons */}
            <div className="p-4 border-b border-gray-100">
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
              <div className="flex items-center justify-between">
                <div className="flex gap-3">
                  <button className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center">
                    <Share className="w-5 h-5 text-gray-600" />
                  </button>
                  <button
                    onClick={() => setShowMobileComments(true)}
                    className="flex items-center gap-1 px-3 py-2 rounded-full border border-gray-300"
                  >
                    <MessageCircle className="w-5 h-5 text-gray-600" />
                  </button>
                  <button
                    onClick={handleLike}
                    disabled={likeLoading}
                    className={`flex items-center gap-1 px-3 py-2 rounded-full border transition-all ${
                      isLiked
                        ? "border-red-500 bg-red-50"
                        : "border-gray-300"
                    } ${likeLoading ? "opacity-50" : ""}`}
                  >
                    <Heart
                      className={`w-5 h-5 ${
                        isLiked
                          ? "text-red-500 fill-current"
                          : "text-gray-600"
                      }`}
                    />
                    <span
                      className={`text-sm ${
                        isLiked ? "text-red-500" : "text-gray-600"
                      }`}
                    >
                      {likesCount}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Product Info */}
            <div className="p-4">
              {/* Contact Buttons */}
              <div className="contact-buttons flex gap-2 mb-4">
                {seller.phone && (
                  <>
                    <ContactButton type="whatsapp" value={seller.phone} />
                    <ContactButton type="phone" value={seller.phone} />
                    <ContactButton type="telegram" value={seller.phone} />
                  </>
                )}
                {seller.email && (
                  <ContactButton type="email" value={seller.email} />
                )}
              </div>
              <hr className="my-4 border-gray-200" />

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
              <div
                key={relatedProduct.id}
                className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer"
                onClick={() => router.push(`/product/${relatedProduct.id}`)}
              >
                <div
                  className="relative w-full bg-gray-100 flex items-center justify-center p-2"
                  style={{ aspectRatio: "1/1" }}
                >
                  <img
                    src={
                      relatedProduct.image_urls?.[0] ||
                      "/placeholder-image.jpg"
                    }
                    alt={relatedProduct.title}
                    className="max-w-full max-h-full object-contain"
                    onError={handleImageError}
                    loading="lazy"
                  />
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-2">
                    {relatedProduct.title}
                  </h3>
                  <div className="text-sm font-bold text-green-600">
                    {formatPrice(relatedProduct.price)}{" "}
                    {relatedProduct.currency}
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
      </div>
    </AppLayout>
  );
}