"use client";
import { useEffect, useState } from "react";
import Image from 'next/image';
import {
  validateProduct,
  cleanText,
  parsePrice,
} from "../../utils/validation";

const SYRIAN_GOVERNORATES = [
  "دمشق", "ريف دمشق", "حلب", "حمص", "حماة", "إدلب",
  "اللاذقية", "طرطوس", "درعا", "السويداء", "القنيطرة",
  "دير الزور", "الرقة", "الحسكة",
];

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function EditProductForm({ product, onClose, onProductUpdated, supabase }) {
  const [formData, setFormData] = useState({
    title: product?.title || "",
    price: product?.price || "",
    description: product?.description || "",
    category: product?.category || "",
    location: product?.location || "",
  });
  
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  if (!product) {
    return <div className="text-gray-900 dark:text-white">خطأ في تحميل بيانات المنتج</div>;
  }

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors.length > 0) setErrors([]);
  };

  const showErrors = (errorList) => {
    setErrors(errorList);
    setTimeout(() => setErrors([]), 5000);
  };

  const validateImageFile = (file) => {
    if (!file) return null;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return "نوع الملف غير مدعوم. استخدم JPEG, PNG, WEBP أو AVIF";
    }

    if (file.size > MAX_FILE_SIZE) {
      return "حجم الصورة كبير جداً. الحد الأقصى 5MB";
    }

    return null;
  };

  const uploadImage = async (file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error("Storage error:", error);
      throw new Error("فشل في رفع الصورة: " + error.message);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleUpdateProduct = async () => {
    try {
      setLoading(true);
      setErrors([]);

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        showErrors(["يجب تسجيل الدخول لتحديث المنتج"]);
        return;
      }

      const cleanedData = {
        title: cleanText(formData.title),
        price: parsePrice(formData.price),
        description: cleanText(formData.description),
        category: cleanText(formData.category),
        location: cleanText(formData.location),
      };

      const validation = validateProduct(cleanedData);
      if (!validation.isValid) {
        showErrors(validation.errors);
        return;
      }

      const updateData = {
        title: cleanedData.title,
        description: cleanedData.description,
        price: cleanedData.price,
        category: cleanedData.category,
        location: cleanedData.location,
      };

      if (imageFile) {
        const imageError = validateImageFile(imageFile);
        if (imageError) {
          showErrors([imageError]);
          return;
        }
        
        const imageUrl = await uploadImage(imageFile);
        updateData.image_urls = [imageUrl];
      }

      const { data: updatedProduct, error: dbError } = await supabase
        .from("ads")
        .update(updateData)
        .eq("id", product.id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (dbError) throw new Error(dbError.message);

      if (!updatedProduct) {
        throw new Error("لم يتم العثور على المنتج أو ليس لديك صلاحية للتعديل");
      }

      onProductUpdated(updatedProduct);

    } catch (error) {
      console.error("Error updating product:", error);
      showErrors([error.message || "حدث خطأ أثناء تحديث المنتج"]);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateImageFile(file);
    if (error) {
      showErrors([error]);
      e.target.value = '';
      return;
    }

    setImageFile(file);
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-end sm:items-center justify-center" 
         style={{ paddingTop: '64px', paddingBottom: '80px' }}>
      <div className="bg-white dark:bg-gray-900 w-full sm:max-w-md sm:mx-4 sm:rounded-xl 
                  max-h-[calc(100vh-144px)] sm:max-h-[calc(90vh-64px)]
                  rounded-t-2xl sm:rounded-b-xl
                  flex flex-col
                  animate-slide-up sm:animate-none">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">تعديل المنتج</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-900 dark:text-white"
            disabled={loading}
            aria-label="إغلاق"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 pb-6">
            
            {/* Error Messages */}
            {errors.length > 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
                {errors.map((error, index) => (
                  <p key={index} className="text-red-600 dark:text-red-400 text-sm">
                    • {error}
                  </p>
                ))}
              </div>
            )}

            {/* Form */}
            <form onSubmit={(e) => { e.preventDefault(); handleUpdateProduct(); }} className="space-y-4">
              
              {/* Product Name */}
              <div>
                <label className="block text-gray-700 dark:text-gray-200 text-sm font-medium mb-2">
                  اسم المنتج *
                </label>
                <input
                  type="text"
                  placeholder="مثال: هاتف ذكي جديد"
                  value={formData.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                  required
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-gray-700 dark:text-gray-200 text-sm font-medium mb-2">
                  السعر (بالليرة السورية) *
                </label>
                <input
                  type="number"
                  placeholder="100000"
                  min="1"
                  value={formData.price}
                  onChange={(e) => updateField("price", e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-gray-700 dark:text-gray-200 text-sm font-medium mb-2">
                  وصف المنتج *
                </label>
                <textarea
                  placeholder="اكتب وصفاً مفصلاً للمنتج..."
                  rows="3"
                  value={formData.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  disabled={loading}
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-gray-700 dark:text-gray-200 text-sm font-medium mb-2">
                  فئة المنتج *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => updateField("category", e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                  required
                >
                  <option value="">اختر الفئة</option>
                  <option value="كتب">📚 كتب</option>
                  <option value="الكترونيات">💻 إلكترونيات</option>
                  <option value="سيارات">🚗 سيارات</option>
                </select>
              </div>

              {/* Location */}
              <div>
                <label className="block text-gray-700 dark:text-gray-200 text-sm font-medium mb-2">
                  الموقع *
                </label>
                <select
                  value={formData.location}
                  onChange={(e) => updateField("location", e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                  required
                >
                  <option value="">اختر المحافظة</option>
                  {SYRIAN_GOVERNORATES.map((province) => (
                    <option key={province} value={province}>
                      {province}
                    </option>
                  ))}
                </select>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-gray-700 dark:text-gray-200 text-sm font-medium mb-2">
                  تغيير صورة المنتج (اختياري)
                </label>
                
                <div className="flex items-start gap-3 mb-3">
                  <Image
                    src={product.image_urls?.[0] || "/placeholder-image.jpg"}
                    alt="الصورة الحالية"
                    width={64}
                    height={64}
                    className="rounded-lg object-cover"
                    unoptimized={product.image_urls?.[0]?.startsWith('http')}
                  />
                  <div className="flex-1 min-w-0">
                    <input
                      type="file"
                      accept={ALLOWED_IMAGE_TYPES.join(',')}
                      onChange={handleImageChange}
                      className="w-full text-sm text-gray-600 dark:text-gray-300 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 dark:file:bg-blue-900/30 file:text-blue-700 dark:file:text-blue-400 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/50"
                      disabled={loading}
                    />
                    {imageFile && (
                      <p className="text-green-600 dark:text-green-400 text-xs mt-1 truncate">
                        تم اختيار: {imageFile.name}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      الحد الأقصى: 5MB | الأنواع: JPEG, PNG, WEBP, AVIF
                    </p>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex-shrink-0 bg-white dark:bg-gray-900">
          <div className="flex gap-3">
            <button
              onClick={handleUpdateProduct}
              disabled={loading}
              className="flex-1 py-3 rounded-lg text-white font-medium transition-all bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  جاري التحديث...
                </div>
              ) : (
                "حفظ التعديلات"
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3 rounded-lg font-medium transition-colors border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              إلغاء
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}