// add-product/page.js
"use client";

import { createClient } from '../../../lib/supabase';
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Upload, Camera, FileImage, X } from "lucide-react";
import AppLayout from "../components/AppLayout";
import Image from 'next/image';

// ثوابت الـ Validation
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_TITLE_LENGTH = 100;
const MAX_DESC_LENGTH = 1000;
const MIN_PRICE = 0;
const MAX_PRICE = 999999999;

export default function AddProductPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const syrianGovernorates = [
    "دمشق", "ريف دمشق", "حلب", "حمص", "حماة", "إدلب",
    "اللاذقية", "طرطوس", "درعا", "السويداء", "القنيطرة",
    "دير الزور", "الرقة", "الحسكة"
  ];

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

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors.length > 0) setErrors([]);
  };

  // ✅ Validation آمن للصور
  const validateImage = (file) => {
    const errors = [];

    if (!file) {
      errors.push("يجب اختيار صورة");
      return errors;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      errors.push("نوع الملف غير مدعوم. استخدم: JPG, PNG, WEBP");
      return errors;
    }

    if (file.size > MAX_FILE_SIZE) {
      errors.push(`حجم الملف كبير جداً. الحد الأقصى ${MAX_FILE_SIZE / 1024 / 1024}MB`);
      return errors;
    }

    return errors;
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationErrors = validateImage(file);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      setTimeout(() => setErrors([]), 5000);
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.onerror = () => {
      setErrors(["فشل في قراءة الصورة"]);
      setTimeout(() => setErrors([]), 5000);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  // ✅ رفع آمن مع تنظيف اسم الملف
  const uploadImage = async (file) => {
    const fileExt = file.name.split(".").pop().toLowerCase();
    // إنشاء اسم آمن بدون محارف خطرة
    const safeName = `${crypto.randomUUID()}.${fileExt}`;

    const { error } = await supabase.storage
      .from("product-images")
      .upload(safeName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) throw new Error("فشل في رفع الصورة");

    const { data: { publicUrl } } = supabase.storage
      .from("product-images")
      .getPublicUrl(safeName);

    return { url: publicUrl, fileName: safeName };
  };

  // ✅ حذف الصورة في حالة الفشل
  const deleteImage = async (fileName) => {
    try {
      await supabase.storage.from("product-images").remove([fileName]);
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Failed to cleanup image:", err);
      }
    }
  };

  // ✅ Validation شامل
  const validateForm = () => {
    const errors = [];

    if (!imageFile) {
      errors.push("يجب اختيار صورة للمنتج");
    }

    const title = formData.title.trim();
    if (!title) {
      errors.push("يجب إدخال عنوان المنتج");
    } else if (title.length > MAX_TITLE_LENGTH) {
      errors.push(`العنوان طويل جداً (الحد الأقصى ${MAX_TITLE_LENGTH} حرف)`);
    }

    const desc = formData.description.trim();
    if (!desc) {
      errors.push("يجب إدخال وصف المنتج");
    } else if (desc.length > MAX_DESC_LENGTH) {
      errors.push(`الوصف طويل جداً (الحد الأقصى ${MAX_DESC_LENGTH} حرف)`);
    }

    const price = parseFloat(formData.price);
    if (!formData.price || isNaN(price) || price <= MIN_PRICE) {
      errors.push("يجب إدخال سعر صحيح");
    } else if (price > MAX_PRICE) {
      errors.push("السعر كبير جداً");
    }

    if (!formData.category) {
      errors.push("يجب اختيار فئة");
    }

    if (!formData.location) {
      errors.push("يجب اختيار الموقع");
    }

    return errors;
  };

  const handleAddProduct = async () => {
    try {
      setLoading(true);
      setErrors([]);

      // ✅ Validation قبل أي عملية
      const validationErrors = validateForm();
      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        setTimeout(() => setErrors([]), 5000);
        return;
      }

      // ✅ التحقق من المستخدم
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error("يجب تسجيل الدخول أولاً");
      }

      // ✅ رفع الصورة
      const { url: imageUrl, fileName } = await uploadImage(imageFile);

      // ✅ حساب تاريخ الانتهاء
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // ✅ إدخال البيانات مع معالجة الأخطاء
      const { error: dbError } = await supabase
        .from("ads")
        .insert({
          user_id: user.id,
          title: formData.title.trim().substring(0, MAX_TITLE_LENGTH),
          description: formData.description.trim().substring(0, MAX_DESC_LENGTH),
          price: parseFloat(formData.price),
          currency: "ل.س",
          category: formData.category,
          location: formData.location,
          image_urls: [imageUrl],
          status: "active",
          expires_at: expiresAt.toISOString(),
        });

      if (dbError) {
        // ✅ حذف الصورة إذا فشل الإدخال
        await deleteImage(fileName);
        throw new Error("فشل في إضافة المنتج");
      }

      // ✅ التوجيه الآمن
      router.replace("/main");
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Error adding product:", error);
      }
      setErrors([error.message || "حدث خطأ أثناء إضافة المنتج"]);
      setTimeout(() => setErrors([]), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">إنشاء منشور</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side - Image Upload */}
          <div className="space-y-4">
            <div className="relative">
              {imagePreview ? (
                <div className="relative aspect-[3/4] bg-gray-100 rounded-2xl overflow-hidden">
                  <Image
                    src={imagePreview}
                    alt="معاينة الصورة"
                    fill
                    className="object-cover"
                  />
                  <button
                    onClick={removeImage}
                    type="button"
                    className="absolute top-3 left-3 p-2 bg-white rounded-full shadow-lg hover:bg-gray-50"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="h-55 bg-gray-100 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors">
                  <Upload className="w-12 h-12 text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-2 text-center">
                    اختر ملفاً أو اسحبه وأفلته هنا
                  </p>
                  <p className="text-sm text-gray-500 text-center px-4">
                    JPG, PNG, WEBP أقل من {MAX_FILE_SIZE / 1024 / 1024}MB
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
                <div className="flex items-center justify-center p-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
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
                <div className="flex items-center justify-center p-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
                  <FileImage className="w-5 h-5 ml-2" />
                  <span>من المعرض</span>
                </div>
              </label>
            </div>
          </div>

          {/* Right Side - Form Fields */}
          <div className="space-y-6">
            {errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4" role="alert">
                {errors.map((error, index) => (
                  <p key={index} className="text-red-600 text-sm mb-1">
                    • {error}
                  </p>
                ))}
              </div>
            )}

            <div>
              <label htmlFor="title" className="block text-gray-700 font-medium mb-2">
                العنوان
              </label>
              <input
                id="title"
                type="text"
                placeholder="إضافة عنوان"
                value={formData.title}
                onChange={(e) => updateField("title", e.target.value)}
                maxLength={MAX_TITLE_LENGTH}
                className="w-full p-4 border border-gray-200 rounded-xl focus:border-red-500 focus:outline-none transition-colors"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-gray-700 font-medium mb-2">
                الوصف
              </label>
              <textarea
                id="description"
                placeholder="إضافة وصف مفصل..."
                rows="4"
                value={formData.description}
                onChange={(e) => updateField("description", e.target.value)}
                maxLength={MAX_DESC_LENGTH}
                className="w-full p-4 border border-gray-200 rounded-xl focus:border-red-500 focus:outline-none resize-none transition-colors"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="price" className="block text-gray-700 font-medium mb-2">
                السعر (ل.س)
              </label>
              <input
                id="price"
                type="number"
                placeholder="0"
                min={MIN_PRICE}
                max={MAX_PRICE}
                step="0.01"
                value={formData.price}
                onChange={(e) => updateField("price", e.target.value)}
                className="w-full p-4 border border-gray-200 rounded-xl focus:border-red-500 focus:outline-none transition-colors"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-gray-700 font-medium mb-2">
                لوحة
              </label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => updateField("category", e.target.value)}
                className="w-full p-4 border border-gray-200 rounded-xl focus:border-red-500 focus:outline-none transition-colors"
                disabled={loading}
              >
                <option value="">اختر لوحة</option>
                <option value="كتب">كتب</option>
                <option value="الكترونيات">إلكترونيات</option>
                <option value="سيارات">سيارات</option>
                <option value="أزياء">أزياء</option>
                <option value="منزل وحديقة">منزل وحديقة</option>
                <option value="رياضة">رياضة</option>
              </select>
            </div>

            <div>
              <label htmlFor="location" className="block text-gray-700 font-medium mb-2">
                الموقع
              </label>
              <select
                id="location"
                value={formData.location}
                onChange={(e) => updateField("location", e.target.value)}
                className="w-full p-4 border border-gray-200 rounded-xl focus:border-red-500 focus:outline-none transition-colors"
                disabled={loading}
              >
                <option value="">اختر الموقع</option>
                {syrianGovernorates.map((province) => (
                  <option key={province} value={province}>
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
                    ? "bg-gray-400 cursor-not-allowed"
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