// add-product/page.js
"use client";

import { createClient } from '../../../lib/supabase';
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Upload, Camera, FileImage, X } from "lucide-react";
import AppLayout from "../components/AppLayout";
import Image from 'next/image';
import { compressImage } from '@/utils/compressImage';

// ثوابت التحقق
const VALIDATION = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  MAX_TITLE: 100,
  MAX_DESC: 1000,
  MIN_PRICE: 0,
  MAX_PRICE: 999999999,
};

const SYRIAN_GOVERNORATES = [
  "دمشق", "ريف دمشق", "حلب", "حمص", "حماة", "إدلب",
  "اللاذقية", "طرطوس", "درعا", "السويداء", "القنيطرة",
  "دير الزور", "الرقة", "الحسكة"
];

// ✅ دالة آمنة لتوليد UUID - تعمل على جميع المتصفحات
function generateSafeUUID() {
  // محاولة استخدام crypto.randomUUID إذا كان متاحاً
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // بديل آمن يعمل على المتصفحات القديمة
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export default function AddProductPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: "",
    price: "",
    description: "",
    category: "",
    location: "",
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);

   // تحديث حقل واحد
  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors.length > 0) setErrors([]);
  };

  // عرض رسالة خطأ
  const showError = (message) => {
    setErrors([message]);
    setTimeout(() => setErrors([]), 5000);
  };

  // التحقق من الصورة
  const validateImage = (file) => {
    if (!file) return "يجب اختيار صورة";
    
    if (!VALIDATION.ALLOWED_TYPES.includes(file.type)) {
      return "نوع الملف غير مدعوم. استخدم: JPG, PNG, WEBP";
    }
    
    if (file.size > VALIDATION.MAX_FILE_SIZE) {
      return `حجم الملف كبير جداً. الحد الأقصى ${VALIDATION.MAX_FILE_SIZE / 1024 / 1024}MB`;
    }
    
    return null;
  };

  // تغيير الصورة
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateImage(file);
    if (error) {
      showError(error);
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.onerror = () => showError("فشل في قراءة الصورة");
    reader.readAsDataURL(file);
  };

  // إزالة الصورة
  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  // رفع الصورة
  const uploadImage = async (file) => {
    const compressedFile = await compressImage(file, 800, 0.7);
    const fileExt = compressedFile.name.split(".").pop().toLowerCase();
    const safeName = `${generateSafeUUID()}.${fileExt}`;

    const { error } = await supabase.storage
      .from("product-images")
      .upload(safeName, compressedFile, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) throw new Error("فشل في رفع الصورة");

    const { data: { publicUrl } } = supabase.storage
      .from("product-images")
      .getPublicUrl(safeName);

    return { url: publicUrl, fileName: safeName };
  };

  // حذف الصورة
  const deleteImage = async (fileName) => {
    try {
      await supabase.storage.from("product-images").remove([fileName]);
    } catch (err) {
      console.error("Failed to cleanup image:", err);
    }
  };

  // التحقق من النموذج
  const validateForm = () => {
    const errors = [];

    if (!imageFile) errors.push("يجب اختيار صورة للمنتج");

    const title = formData.title.trim();
    if (!title) {
      errors.push("يجب إدخال عنوان المنتج");
    } else if (title.length > VALIDATION.MAX_TITLE) {
      errors.push(`العنوان طويل جداً (الحد الأقصى ${VALIDATION.MAX_TITLE} حرف)`);
    }

    const desc = formData.description.trim();
    if (!desc) {
      errors.push("يجب إدخال وصف المنتج");
    } else if (desc.length > VALIDATION.MAX_DESC) {
      errors.push(`الوصف طويل جداً (الحد الأقصى ${VALIDATION.MAX_DESC} حرف)`);
    }

    const price = parseFloat(formData.price);
    if (!formData.price || isNaN(price) || price <= VALIDATION.MIN_PRICE) {
      errors.push("يجب إدخال سعر صحيح");
    } else if (price > VALIDATION.MAX_PRICE) {
      errors.push("السعر كبير جداً");
    }

    if (!formData.category) errors.push("يجب اختيار فئة");
    if (!formData.location) errors.push("يجب اختيار الموقع");

    return errors;
  };

  // إضافة المنتج
  const handleAddProduct = async () => {
    try {
      setLoading(true);
      setErrors([]);

      // التحقق من النموذج
      const validationErrors = validateForm();
      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        setTimeout(() => setErrors([]), 5000);
        return;
      }

      // التحقق من المستخدم
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error("يجب تسجيل الدخول أولاً");
      }

      // رفع الصورة
      const { url: imageUrl, fileName } = await uploadImage(imageFile);

      // حساب تاريخ الانتهاء
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // إدخال البيانات
      const { error: dbError } = await supabase
        .from("ads")
        .insert({
          user_id: user.id,
          title: formData.title.trim().substring(0, VALIDATION.MAX_TITLE),
          description: formData.description.trim().substring(0, VALIDATION.MAX_DESC),
          price: parseFloat(formData.price),
          currency: "ل.س",
          category: formData.category,
          location: formData.location,
          image_urls: [imageUrl],
          status: "active",
          expires_at: expiresAt.toISOString(),
        });

		await fetch("/api/send-push", {
  method: "POST",
  body: JSON.stringify({
    title: "🎉 منتج جديد!",
    message: "تمت إضافة منتج جديد إلى المتجر.",
  }),
});

		
		
      if (dbError) {
        await deleteImage(fileName);
        throw new Error("فشل في إضافة المنتج");
      }

      router.replace("/dashboard");
    } catch (error) {
      console.error("Error adding product:", error);
      showError(error.message || "حدث خطأ أثناء إضافة المنتج");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">إنشاء منشور</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* قسم الصورة */}
          <div className="space-y-4">
            <div className="relative">
              {imagePreview ? (
                <div className="relative aspect-[3/4] bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden">
                  <Image
                    src={imagePreview}
                    alt="معاينة الصورة"
                    fill
                    className="object-cover"
                  />
                  <button
                    onClick={removeImage}
                    type="button"
                    className="absolute top-3 left-3 p-2 bg-white dark:bg-gray-900 rounded-full shadow-lg dark:shadow-gray-900/50 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="h-55 bg-gray-100 dark:bg-gray-800 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-gray-400 transition-colors">
                  <Upload className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-4" />
                  <p className="text-gray-600 dark:text-gray-300 mb-2 text-center">
                    اختر ملفاً أو اسحبه وأفلته هنا
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center px-4">
                    JPG, PNG, WEBP أقل من {VALIDATION.MAX_FILE_SIZE / 1024 / 1024}MB
                  </p>
                
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="relative cursor-pointer">
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  capture="environment"
                  onChange={handleImageChange}
                  disabled={loading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex items-center justify-center p-3 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  <Camera className="w-5 h-5 ml-2" />
                  <span>التقاط صورة</span>
                </div>
              </label>

              <label className="relative cursor-pointer">
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleImageChange}
                  disabled={loading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex items-center justify-center p-3 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  <FileImage className="w-5 h-5 ml-2" />
                  <span>من المعرض</span>
                </div>
              </label>
            </div>
          </div>

          {/* قسم النموذج */}
          <div className="space-y-6">
            {errors.length > 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4" role="alert">
                {errors.map((error, index) => (
                  <p key={index} className="text-red-600 dark:text-red-400 text-sm mb-1">
                    • {error}
                  </p>
                ))}
              </div>
            )}

            <div>
              <label htmlFor="title" className="block text-gray-700 dark:text-gray-200 font-medium mb-2">
                العنوان
              </label>
              <input
                id="title"
                type="text"
                placeholder="إضافة عنوان"
                value={formData.title}
                onChange={(e) => updateField("title", e.target.value)}
                maxLength={VALIDATION.MAX_TITLE}
                className="w-full p-4 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-xl focus:border-red-500 focus:outline-none transition-colors"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-gray-700 dark:text-gray-200 font-medium mb-2">
                الوصف
              </label>
              <textarea
                id="description"
                placeholder="إضافة وصف مفصل..."
                rows="4"
                value={formData.description}
                onChange={(e) => updateField("description", e.target.value)}
                maxLength={VALIDATION.MAX_DESC}
                className="w-full p-4 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-xl focus:border-red-500 focus:outline-none resize-none transition-colors"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="price" className="block text-gray-700 dark:text-gray-200 font-medium mb-2">
                السعر (ل.س)
              </label>
              <input
                id="price"
                type="number"
                placeholder="0"
                min={VALIDATION.MIN_PRICE}
                max={VALIDATION.MAX_PRICE}
                step="0.01"
                value={formData.price}
                onChange={(e) => updateField("price", e.target.value)}
                className="w-full p-4 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-xl focus:border-red-500 focus:outline-none transition-colors"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-gray-700 dark:text-gray-200 font-medium mb-2">
                لوحة
              </label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => updateField("category", e.target.value)}
                className="w-full p-4 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-xl focus:border-red-500 focus:outline-none transition-colors"
                disabled={loading}
              >
                <option value="" className="bg-white dark:bg-gray-900">اختر لوحة</option>
                <option value="كتب" className="bg-white dark:bg-gray-900">كتب</option>
                <option value="الكترونيات" className="bg-white dark:bg-gray-900">إلكترونيات</option>
                <option value="سيارات" className="bg-white dark:bg-gray-900">سيارات</option>
                <option value="أزياء" className="bg-white dark:bg-gray-900">أزياء</option>
                <option value="منزل وحديقة" className="bg-white dark:bg-gray-900">منزل وحديقة</option>
                <option value="رياضة" className="bg-white dark:bg-gray-900">رياضة</option>
              </select>
            </div>

            <div>
              <label htmlFor="location" className="block text-gray-700 dark:text-gray-200 font-medium mb-2">
                الموقع
              </label>
              <select
                id="location"
                value={formData.location}
                onChange={(e) => updateField("location", e.target.value)}
                className="w-full p-4 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-xl focus:border-red-500 focus:outline-none transition-colors"
                disabled={loading}
              >
                <option value="" className="bg-white dark:bg-gray-900">اختر الموقع</option>
                {SYRIAN_GOVERNORATES.map((province) => (
                  <option key={province} value={province} className="bg-white dark:bg-gray-900">
                    {province}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-4">
              <button
                onClick={handleAddProduct}
                disabled={loading}
                type="button"
                className={`w-full py-4 rounded-full text-white font-medium transition-colors ${
                  loading
                    ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed" // تم إضافة dark:bg-gray-600 للتباين
                    : "bg-red-500 hover:bg-red-600"
                }`}
              >
                {loading ? "جاري النشر..." : "نشر"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}