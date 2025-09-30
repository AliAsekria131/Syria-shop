// add-product
"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Camera, FileImage, X } from "lucide-react";
import AppLayout from "../components/AppLayout";

export default function AddProductPage() {
  const router = useRouter();
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
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);

  // دالة تحديث الحقول
  const updateField = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors.length > 0) {
      setErrors([]);
    }
  };

  // دالة التعامل مع الصورة
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // دالة إزالة الصورة
  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  // دالة عرض رسائل الخطأ
  const showErrors = (errorList) => {
    setErrors(errorList);
    setTimeout(() => setErrors([]), 5000);
  };

  const uploadImage = async (file) => {
    // إنشاء اسم فريد للملف
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random()
      .toString(36)
      .substring(2)}-${Date.now()}.${fileExt}`;

    // رفع الصورة إلى Supabase Storage
    const { data, error } = await supabase.storage
      .from("product-images")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Supabase upload error:", error);
      throw new Error(error.message || "فشل في رفع الصورة");
    }

    // الحصول على الرابط العام للصورة
    const {
      data: { publicUrl },
    } = supabase.storage.from("product-images").getPublicUrl(fileName);

    console.log("Upload successful, URL:", publicUrl);
    return publicUrl;
  };

  // دالة إضافة المنتج
  const handleAddProduct = async () => {
    try {
      setLoading(true);
      setErrors([]);

      if (!imageFile) {
        showErrors(["يجب اختيار صورة للمنتج"]);
        return;
      }

      if (!formData.title.trim()) {
        showErrors(["يجب إدخال عنوان المنتج"]);
        return;
      }

      if (!formData.description.trim()) {
        showErrors(["يجب إدخال وصف المنتج"]);
        return;
      }

      if (!formData.price || parseFloat(formData.price) <= 0) {
        showErrors(["يجب إدخال سعر صحيح"]);
        return;
      }

      if (!formData.category) {
        showErrors(["يجب اختيار فئة"]);
        return;
      }

      if (!formData.location) {
        showErrors(["يجب اختيار الموقع"]);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const imageUrl = await uploadImage(imageFile);

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { data: productData, error: dbError } = await supabase
        .from("ads")
        .insert([
          {
            user_id: user.id,
            title: formData.title.trim(),
            description: formData.description.trim(),
            price: parseFloat(formData.price),
            currency: "ل.س",
            category: formData.category,
            location: formData.location,
            image_urls: [imageUrl],
            status: "active",
            expires_at: expiresAt.toISOString(),
          },
        ])
        .select();

      if (dbError) {
        throw new Error(dbError.message);
      }

      alert("تم إضافة المنتج بنجاح!");
      router.push("/main");
    } catch (error) {
      console.error("Error adding product:", error);
      showErrors([error.message || "حدث خطأ أثناء إضافة المنتج"]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      {/* Mobile Header 
      <div className="md:hidden sticky top-0 z-40 bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">إنشاء منشور</h1>
          <div className="w-10"></div>
        </div>
      </div>*/}

      {/* Form Content */}
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        {/* Page Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-8">إنشاء منشور</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side - Image Upload */}
          <div className="space-y-4">
            <div className="relative">
              {imagePreview ? (
                <div className="relative aspect-[3/4] bg-gray-100 rounded-2xl overflow-hidden">
                  <img
                    src={imagePreview}
                    alt="معاينة الصورة"
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={removeImage}
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
                    ننصح باستخدام صورة عالية الجودة أقل من 20 ميجابايت
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="relative cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageChange}
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
                  accept="image/*"
                  onChange={handleImageChange}
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
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                {errors.map((error, index) => (
                  <p key={index} className="text-red-600 text-sm mb-1">
                    • {error}
                  </p>
                ))}
              </div>
            )}

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                العنوان
              </label>
              <input
                type="text"
                placeholder="إضافة عنوان"
                value={formData.title}
                onChange={(e) => updateField("title", e.target.value)}
                className="w-full p-4 border border-gray-200 rounded-xl focus:border-red-500 focus:outline-none transition-colors"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                الوصف
              </label>
              <textarea
                placeholder="إضافة وصف مفصل..."
                rows="4"
                value={formData.description}
                onChange={(e) => updateField("description", e.target.value)}
                className="w-full p-4 border border-gray-200 rounded-xl focus:border-red-500 focus:outline-none resize-none transition-colors"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                السعر (ل.س)
              </label>
              <input
                type="number"
                placeholder="0"
                value={formData.price}
                onChange={(e) => updateField("price", e.target.value)}
                className="w-full p-4 border border-gray-200 rounded-xl focus:border-red-500 focus:outline-none transition-colors"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                لوحة
              </label>
              <select
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
              <label className="block text-gray-700 font-medium mb-2">
                الموضوعات المميزة بعلامة (0)
              </label>
              <select
                value={formData.location}
                onChange={(e) => updateField("location", e.target.value)}
                className="w-full p-4 border border-gray-200 rounded-xl focus:border-red-500 focus:outline-none transition-colors"
                disabled={loading}
              >
                <option value="">البحث عن علامة</option>
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