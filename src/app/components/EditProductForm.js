"use client";
import React from 'react';
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "../../utils/auth";
import {
  validateProduct,
  cleanText,
  parsePrice,
} from "../../utils/validation";

// مكون تعديل المنتج - محسن
// الحل: وحّد الاسماء
export default function EditProductForm({ product, onClose, onProductUpdated, supabase }) {
	
	  useEffect(() => {
  // منع التمرير في الخلفية عند فتح النافذة
  document.body.style.overflow = 'hidden';
  
  return () => {
    document.body.style.overflow = 'auto';
  };
}, []);

  if (!product) {
    return <div>خطأ في تحميل بيانات المنتج</div>;
  }
  

  const syrianGovernorates = [
    "دمشق", "ريف دمشق", "حلب", "حمص", "حماة", "إدلب",
    "اللاذقية", "طرطوس", "درعا", "السويداء", "القنيطرة",
    "دير الزور", "الرقة", "الحسكة",
  ];

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

  const updateField = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const showErrors = (errorList) => {
    setErrors(errorList);
    setTimeout(() => setErrors([]), 5000);
  };

  const uploadImage = async (file) => {
    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "فشل في رفع الصورة");
      }

      return result.url;
    } catch (error) {
      throw new Error("فشل في رفع الصورة: " + error.message);
    }
  };

  const handleUpdateProduct = async () => {
    try {
      setLoading(true);
      setErrors([]);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
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

      let updateData = {
        title: cleanedData.title,
        description: cleanedData.description,
        price: cleanedData.price,
        category: cleanedData.category,
        location: cleanedData.location,
      };

      if (imageFile) {
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

      if (dbError) {
        throw new Error(dbError.message);
      }

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




    return (
  <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center" 
     style={{ paddingTop: '64px', paddingBottom: '80px' }}>
    {/* Mobile: Full screen from bottom, Desktop: Centered modal */}
    <div className="bg-white w-full sm:max-w-md sm:mx-4 sm:rounded-xl 
                max-h-[calc(100vh-144px)] sm:max-h-[calc(90vh-64px)]
                rounded-t-2xl sm:rounded-b-xl
                flex flex-col
                animate-slide-up sm:animate-none">
      
      {/* Header - Fixed */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
        <h2 className="text-xl font-bold text-gray-800">تعديل المنتج</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          disabled={loading}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 pb-6">
          
          {/* Error Messages */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              {errors.map((error, index) => (
                <p key={index} className="text-red-600 text-sm">
                  • {error}
                </p>
              ))}
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleUpdateProduct();
            }}
            className="space-y-4"
          >
            {/* Product Name */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                اسم المنتج *
              </label>
              <input
                type="text"
                placeholder="مثال: هاتف ذكي جديد"
                value={formData.title}
                onChange={(e) => updateField("title", e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                السعر (بالليرة السورية) *
              </label>
              <input
                type="number"
                placeholder="100000"
                min="1"
                value={formData.price}
                onChange={(e) => updateField("price", e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                وصف المنتج *
              </label>
              <textarea
                placeholder="اكتب وصفاً مفصلاً للمنتج..."
                rows="3"
                value={formData.description}
                onChange={(e) => updateField("description", e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                disabled={loading}
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                فئة المنتج *
              </label>
              <select
                value={formData.category}
                onChange={(e) => updateField("category", e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                disabled={loading}
              >
                <option value="">اختر الفئة</option>
                <option value="كتب">📚 كتب</option>
                <option value="الكترونيات">💻 إلكترونيات</option>
                <option value="سيارات">🚗 سيارات</option>
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                الموقع *
              </label>
              <select
                value={formData.location}
                onChange={(e) => updateField("location", e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                disabled={loading}
              >
                <option value="">اختر المحافظة</option>
                {syrianGovernorates.map((province) => (
                  <option key={province} value={province}>
                    {province}
                  </option>
                ))}
              </select>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                تغيير صورة المنتج (اختياري)
              </label>
              
              <div className="flex items-start gap-3 mb-3">
                <img
                  src={product.image_urls?.[0] || "/placeholder-image.jpg"}
                  alt="الصورة الحالية"
                  className="w-16 h-16 object-cover rounded-lg border border-gray-300 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files[0])}
                    className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    disabled={loading}
                  />
                  {imageFile && (
                    <p className="text-green-600 text-xs mt-1 truncate">
                      تم اختيار: {imageFile.name}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Footer - Fixed */}
      <div className="border-t border-gray-200 p-4 flex-shrink-0 bg-white">
        <div className="flex gap-3">
          <button
            onClick={() => {
              const form = document.querySelector('form');
              if (form) {
                const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
                form.dispatchEvent(submitEvent);
              }
            }}
            disabled={loading}
            className="flex-1 py-3 rounded-lg text-white font-medium transition-all bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
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
            className="flex-1 py-3 rounded-lg font-medium transition-colors border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  </div>
);


}