// ProductDetails.client.jsx
"use client";

import { useState } from "react";
import { 
  MessageCircle, 
  Share2, 
  MapPin, 
  Phone, 
  Mail, 
  Send,
  X,
  Star,
  Heart,
} from "lucide-react";
import Image from 'next/image';

export default function ProductDetails({ 
  product, 
  seller, 
  relatedProducts = [], 
  commentsCount = 0 
}) {
  const [showMobileComments, setShowMobileComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [newRating, setNewRating] = useState(5);
  const [isLiked, setIsLiked] = useState(false);

  // TODO: fetch comments من الـ API
  const mockComments = [
    { 
      id: 1, 
      user: "أحمد محمد", 
      comment: "منتج ممتاز جداً وبسعر مناسب", 
      rating: 5, 
      date: "منذ يومين" 
    },
    { 
      id: 2, 
      user: "فاطمة علي", 
      comment: "التسليم سريع والجودة عالية", 
      rating: 4, 
      date: "منذ أسبوع" 
    }
  ];

  const formatPrice = (price) => {
    return new Intl.NumberFormat("ar-SY").format(price);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.title,
        text: product.description,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("تم نسخ الرابط!");
    }
  };

  const handleAddComment = () => {
    // TODO: إضافة تعليق جديد عبر الـ API
    console.log("Adding comment:", { comment: newComment, rating: newRating });
    setNewComment("");
    setNewRating(5);
    setShowMobileComments(false);
  };

  const openWhatsApp = () => {
    window.open(`https://wa.me/963${seller.phone?.replace(/\D/g, "")}`, "_blank");
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? "text-yellow-400 fill-current" : "text-gray-300 dark:text-gray-600"
        }`}
      />
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir="rtl">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Main Image Section - Pinterest Style */}
          <div className="lg:col-span-2">
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm dark:shadow-gray-900/50 sticky top-6">
              <div className="aspect-[3/4] relative">
  <Image
    src={product.image_urls?.[0] || "/placeholder.jpg"}
    alt={product.title}
    fill
    className="object-cover"
    unoptimized={product.image_urls?.[0]?.startsWith('http')}
  />
                
                {/* Floating Action Buttons */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  <button
                    onClick={() => setShowMobileComments(true)}
                    className="bg-white dark:bg-gray-800 rounded-full p-3 shadow-lg dark:shadow-gray-900/50 hover:shadow-xl transition-shadow flex items-center gap-2"
                  >
                    <MessageCircle className="w-5 h-5 text-gray-900 dark:text-white" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{commentsCount}</span>
                  </button>
                  
                  <button
                    onClick={handleShare}
                    className="bg-white dark:bg-gray-800 rounded-full p-3 shadow-lg dark:shadow-gray-900/50 hover:shadow-xl transition-shadow"
                  >
                    <Share2 className="w-5 h-5 text-gray-900 dark:text-white" />
                  </button>

                  <button
                    onClick={() => setIsLiked(!isLiked)}
                    className="bg-white dark:bg-gray-800 rounded-full p-3 shadow-lg dark:shadow-gray-900/50 hover:shadow-xl transition-shadow"
                  >
                    <Heart className={`w-5 h-5 ${isLiked ? "text-red-500 fill-current" : "text-gray-900 dark:text-white"}`} />
                  </button>
                </div>

                {/* Category Badge */}
                <div className="absolute top-4 right-4">
                  <span className="bg-black/70 dark:bg-white/20 text-white px-3 py-1 rounded-full text-sm">
                    {product.category}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Product Info Section */}
          <div className="lg:col-span-1 space-y-6">
            {/* Product Details */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm dark:shadow-gray-900/50">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                {product.title}
              </h1>
              
              <div className="text-3xl font-bold text-green-600 mb-4">
                {formatPrice(product.price)} {product.currency}
              </div>

              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 mb-4">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">{product.location}</span>
              </div>

              <p className="text-gray-700 dark:text-gray-200 leading-relaxed mb-6">
                {product.description}
              </p>

              {/* Seller Info - Pinterest Style */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <span className="font-bold text-gray-600 dark:text-gray-300">
                      {seller.full_name?.charAt(0) || "؟"}
                    </span>
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {seller.full_name || "البائع"}
                  </span>
                </div>

                {/* Contact Options */}
                <div className="space-y-2">
                  {seller.phone && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => window.open(`tel:${seller.phone}`, "_blank")}
                        className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-blue-600"
                      >
                        <Phone className="w-4 h-4" />
                        اتصال
                      </button>
                      <button
                        onClick={openWhatsApp}
                        className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-green-600"
                      >
                        <Send className="w-4 h-4" />
                        واتساب
                      </button>
                    </div>
                  )}
                  
                  {seller.email && (
                    <button
                      onClick={() => window.open(`mailto:${seller.email}`, "_blank")}
                      className="w-full bg-gray-500 text-white py-2 px-4 rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-gray-600"
                    >
                      <Mail className="w-4 h-4" />
                      إيميل
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Desktop Comments Section */}
            <div className="hidden lg:block">
              <div id="comments-section" className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm dark:shadow-gray-900/50">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                  <MessageCircle className="w-5 h-5" />
                  التعليقات ({commentsCount})
                </h3>
                
                {/* Comments List */}
                <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                  {mockComments.map((comment) => (
                    <div key={comment.id} className="border-b border-gray-100 dark:border-gray-700 pb-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-gray-900 dark:text-white">
                            {comment.user.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm text-gray-900 dark:text-white">{comment.user}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{comment.date}</span>
                          </div>
                          <div className="flex mb-1">
                            {renderStars(comment.rating)}
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-200">{comment.comment}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Comment Form */}
                <div className="space-y-3">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setNewRating(star)}
                        className={`text-lg ${
                          star <= newRating ? "text-yellow-400" : "text-gray-300 dark:text-gray-600"
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="اكتب تعليقك..."
                    className="w-full p-3 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                  />
                  
                  <button
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                    className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50"
                  >
                    إضافة تعليق
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Related Products Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm dark:shadow-gray-900/50 sticky top-6">
              <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">منتجات مشابهة</h3>
              
              <div className="space-y-4">
                {relatedProducts.slice(0, 6).map((item) => (
                  <div key={item.id} className="flex gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
  <Image
    src={item.image_urls?.[0] || "/placeholder.jpg"}
    alt={item.title}
    fill
    className="object-cover"
    unoptimized={item.image_urls?.[0]?.startsWith('http')}
    sizes="64px"
  />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm line-clamp-2 mb-1 text-gray-900 dark:text-white">
                        {item.title}
                      </h4>
                      <p className="text-green-600 font-bold text-sm">
                        {formatPrice(item.price)} {item.currency}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {item.location}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Comments Modal */}
      {showMobileComments && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50 dark:bg-white/10" style={{ zIndex: 9999 }}>
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-2xl h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">التعليقات ({commentsCount})</h3>
              <button
                onClick={() => setShowMobileComments(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
              >
                <X className="w-5 h-5 text-gray-900 dark:text-white" />
              </button>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {mockComments.map((comment) => (
                <div key={comment.id} className="border-b border-gray-100 dark:border-gray-700 pb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="font-bold text-sm text-gray-900 dark:text-white">
                        {comment.user.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-gray-900 dark:text-white">{comment.user}</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{comment.date}</span>
                      </div>
                      <div className="flex mb-2">
                        {renderStars(comment.rating)}
                      </div>
                      <p className="text-gray-700 dark:text-gray-200">{comment.comment}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Comment Form - Fixed at bottom */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setNewRating(star)}
                    className={`text-xl ${
                      star <= newRating ? "text-yellow-400" : "text-gray-300 dark:text-gray-600"
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
              
              <div className="flex gap-2">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="اكتب تعليقك..."
                  className="flex-1 p-3 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="2"
                />
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 self-end"
                >
                  إرسال
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}