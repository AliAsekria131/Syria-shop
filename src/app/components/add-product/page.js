// add-product

"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useState } from "react";
import Popup from "../popup/page";

// استيراد مساعدات التحقق
import {
  validateProduct,
  cleanText,
  parsePrice,
} from "../../../utils/validation";

export default function AddProduct({ onProductAdded, isOpen, setIsOpen }) {
  const supabase = createClientComponentClient();
  // المحافظات السورية
  const syrianGovernorates = [
    "دمشق",
    "ريف دمشق",
    "حلب",
    "حمص",
    "حماة",
    "إدلب",
    "اللاذقية",
    "طرطوس",
    "درعا",
    "السويداء",
    "القنيطرة",
    "دير الزور",
    "الرقة",
    "الحسكة",
  ];
  // حالات الحقول
  const [formData, setFormData] = useState({
    title: "",
    price: "",
    description: "",
    category: "",
    location: "",
  });

  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);

  // دالة تحديث الحقول
  const updateField = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // إزالة الأخطاء عند الكتابة
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  // دالة عرض رسائل الخطأ
  const showErrors = (errorList) => {
    setErrors(errorList);
    setTimeout(() => setErrors([]), 5000); // إخفاء الأخطاء بعد 5 ثواني
  };

  // دالة رفع الصورة
  const uploadImage = async (file) => {
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
  };

  // دالة إضافة المنتج
  const handleAddProduct = async () => {
    try {
      setLoading(true);
      setErrors([]);

      // 1. التحقق من تسجيل الدخول
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        showErrors(["يجب تسجيل الدخول لإضافة منتج"]);
        return;
      }

      // 2. التحقق من وجود الصورة
      if (!imageFile) {
        showErrors(["يجب اختيار صورة للمنتج"]);
        return;
      }

      // 3. تنظيف وتحضير البيانات
      const cleanedData = {
        title: cleanText(formData.title),
        price: parsePrice(formData.price),
        description: cleanText(formData.description),
        category: cleanText(formData.category),
        location: cleanText(formData.location),
      };

      // 4. التحقق من صحة البيانات
      const validation = validateProduct(cleanedData);
      if (!validation.isValid) {
        showErrors(validation.errors);
        return;
      }

      // 5. رفع الصورة أولاً
      const imageUrl = await uploadImage(imageFile);

// 6. إضافة المنتج إلى قاعدة البيانات مع تاريخ انتهاء الصلاحية
// حساب تاريخ انتهاء الصلاحية (7 أيام من الآن)
const expiresAt = new Date();
expiresAt.setDate(expiresAt.getDate() + 7);

const { data: productData, error: dbError } = await supabase
  .from("ads")
  .insert([
    {
      user_id: user.id,
      title: cleanedData.title,
      description: cleanedData.description,
      price: cleanedData.price,
      currency: "ل.س",
      category: cleanedData.category,
      location: cleanedData.location,
      image_urls: [imageUrl],
      status: "active",
      expires_at: expiresAt.toISOString(), // إضافة تاريخ انتهاء الصلاحية
    },
  ])
  .select();

      if (dbError) {
        throw new Error(dbError.message);
      }

      // 7. نجح الحفظ!
      alert("✅ تم إضافة المنتج بنجاح!");

      // 8. إعادة تعيين النموذج
      resetForm();

      // 9. إغلاق النافذة المنبثقة
      setIsOpen(false);

      // 10. تنبيه المكون الأب بالمنتج الجديد
      if (onProductAdded && productData?.[0]) {
        onProductAdded(productData[0]);
      }
    } catch (error) {
      console.error("Error adding product:", error);
      showErrors([error.message || "حدث خطأ أثناء إضافة المنتج"]);
    } finally {
      setLoading(false);
    }
  };

  // دالة إعادة تعيين النموذج
  const resetForm = () => {
    setFormData({
      title: "",
      price: "",
      description: "",
      category: "",
      location: "",
    });
    setImageFile(null);
    setErrors([]);
  };

  return (
    <Popup isOpen={isOpen} onClose={() => setIsOpen(false)}>
<div className="w-full">
  <h2 className="text-xl sm:text-2xl font-bold text-center mb-4 sm:mb-6 text-gray-800">
    إضافة منتج جديد
  </h2>
  
  {/* باقي المحتوى يبقى كما هو */}

        {/* عرض الأخطاء */}
        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            {errors.map((error, index) => (
              <p key={index} className="text-red-600 text-sm">
                ❌ {error}
              </p>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAddProduct();
          }}
        >
          {/* اسم المنتج */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              اسم المنتج *
            </label>
            <input
              type="text"
              placeholder="مثال: هاتف ذكي جديد"
              value={formData.title}
              onChange={(e) => updateField("title", e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              disabled={loading}
            />
          </div>

          {/* السعر */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              السعر (بالليرة السورية) *
            </label>
            <input
              type="number"
              placeholder="100000"
              min="1"
              value={formData.price}
              onChange={(e) => updateField("price", e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              disabled={loading}
            />
          </div>

          {/* الوصف */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              وصف المنتج *
            </label>
            <textarea
              placeholder="اكتب وصفاً مفصلاً للمنتج..."
              rows="3"
              value={formData.description}
              onChange={(e) => updateField("description", e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              disabled={loading}
            />
          </div>

          {/* الفئة */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              فئة المنتج *
            </label>
            <select
              value={formData.category}
              onChange={(e) => updateField("category", e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              disabled={loading}
            >
              <option value="">اختر الفئة</option>
              <option value="كتب">📚 كتب</option>
              <option value="الكترونيات">💻 إلكترونيات</option>
              <option value="سيارات">🚗 سيارات</option>
            </select>
          </div>

          {/* الموقع */}

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              الموقع *
            </label>
            <select
              value={formData.location}
              onChange={(e) => updateField("location", e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
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

          {/* رفع الصورة */}
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              صورة المنتج *
            </label>

            {/* خيار 1: التقاط صورة بالكاميرا */}
            <div className="mb-3">
              <label className="block text-blue-600 text-sm mb-1 cursor-pointer">
                📷 التقاط صورة (الكاميرا الخلفية)
              </label>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => setImageFile(e.target.files[0])}
                className="w-full p-2 border border-gray-300 rounded-lg opacity-0 absolute h-10 cursor-pointer"
                style={{ zIndex: 10 }}
              />
              <div className="p-3 bg-gray-100 rounded-lg text-center text-gray-600 text-sm border-dashed border-2 border-gray-300 cursor-pointer hover:bg-gray-200">
                اضغط لفتح الكاميرا
              </div>
            </div>

            {/* خيار 2: اختيار من المعرض */}
            <div className="mb-3">
              <label className="block text-green-600 text-sm mb-1 cursor-pointer">
                🖼️ اختيار من المعرض
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files[0])}
                className="w-full p-2 border border-gray-300 rounded-lg opacity-0 absolute h-10 cursor-pointer"
                style={{ zIndex: 10 }}
              />
              <div className="p-3 bg-gray-100 rounded-lg text-center text-gray-600 text-sm border-dashed border-2 border-gray-300 cursor-pointer hover:bg-gray-200">
                اضغط لاختيار صورة من المعرض
              </div>
            </div>

            {imageFile && (
              <p className="text-green-600 text-sm mt-1">
                ✅ تم اختيار: {imageFile.name}
              </p>
            )}
          </div>

          {/* أزرار التحكم */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 py-3 rounded-lg text-white font-bold transition-all ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-500 hover:bg-green-600"
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  جاري الحفظ...
                </div>
              ) : (
                "💾 حفظ المنتج"
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              disabled={loading}
              className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </Popup>
  );
}
