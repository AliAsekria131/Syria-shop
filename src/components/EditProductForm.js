"use client";
import { useEffect, useState } from "react";
import Image from 'next/image';

// قائمة المحافظات السورية
const SYRIAN_GOVERNORATES = [
  "دمشق", "ريف دمشق", "حلب", "حمص", "حماة", "إدلب",
  "اللاذقية", "طرطوس", "درعا", "السويداء", "القنيطرة",
  "دير الزور", "الرقة", "الحسكة",
];

export default function EditProductForm({ product, onClose, onProductUpdated, supabase }) {
  // حالة بيانات النموذج
  const [formData, setFormData] = useState({
    title: product?.title || "",
    price: product?.price || "",
    description: product?.description || "",
    category: product?.category || "",
    location: product?.location || "",
  });
  
  // حالة الصورة المختارة
  const [imageFile, setImageFile] = useState(null);
  
  // حالة التحميل
  const [loading, setLoading] = useState(false);
  
  // حالة الأخطاء
  const [errors, setErrors] = useState([]);

  // منع التمرير عند فتح النموذج
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  // التحقق من وجود المنتج
  if (!product) {
    return <div className="text-gray-900 dark:text-white">خطأ في تحميل بيانات المنتج</div>;
  }

  // تحديث حقل في النموذج
  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // إخفاء الأخطاء عند التعديل
    if (errors.length > 0) setErrors([]);
  };

  // عرض رسائل الخطأ لمدة 5 ثوان
  const showErrors = (errorList) => {
    setErrors(errorList);
    setTimeout(() => setErrors([]), 5000);
  };

  // رفع الصورة إلى Supabase Storage
  const uploadImage = async (file) => {
    // إنشاء اسم فريد للملف
    const fileName = product.image_urls.toString().split("product-images/").pop();
    
    const filePath = `${fileName}`;
    // رفع الصورة
    const { data, error } = await supabase.storage.from('product-images').upload(filePath, file, {upsert: true});

    if (error) {
      console.error("Storage error:", error);
      throw new Error("فشل في رفع الصورة: " + error.message);
    }

    // الحصول على الرابط العام للصورة
    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  // معالجة تحديث المنتج
  const handleUpdateProduct = async () => {

    try {
      setLoading(true);
      setErrors([]);

      // التحقق من تسجيل الدخول
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        showErrors(["يجب تسجيل الدخول لتحديث المنتج"]);
        return;
      }

      // إعداد البيانات للتحديث
      const updateData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        category: formData.category,
        location: formData.location,
      };

      // التحقق من البيانات الأساسية
      if (!updateData.title || !updateData.description || !updateData.price || !updateData.category || !updateData.location) {
        showErrors(["جميع الحقول مطلوبة"]);
        return;
      }

      // رفع الصورة الجديدة إذا تم اختيارها
      if (imageFile) {
        try {
          const imageUrl = await uploadImage(imageFile);
          updateData.image_urls = [imageUrl];
        } catch (error) {
          showErrors([error.message]);
          return;
        }
      }

      // تحديث المنتج في قاعدة البيانات
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

      // إعلام المكون الأب بالتحديث
      onProductUpdated(updatedProduct);

    } catch (error) {
      showErrors([error.message || "حدث خطأ أثناء تحديث المنتج"]);
    } finally {
      setLoading(false);
    }
  };

  // معالجة تغيير الصورة
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-end sm:items-center justify-center" 
         style={{ paddingTop: '64px', paddingBottom: '80px' }}>
      <div className="bg-white dark:bg-gray-900 w-full sm:max-w-md sm:mx-4 sm:rounded-xl 
                  max-h-[calc(100vh-144px)] sm:max-h-[calc(90vh-64px)]
                  rounded-t-2xl sm:rounded-b-xl
                  flex flex-col
                  animate-slide-up sm:animate-none">
        
        {/* رأس النموذج */}
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

        {/* محتوى النموذج */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 pb-6">
            
            {/* رسائل الخطأ */}
            {errors.length > 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
                {errors.map((error, index) => (
                  <p key={index} className="text-red-600 dark:text-red-400 text-sm">
                    • {error}
                  </p>
                ))}
              </div>
            )}

            {/* النموذج */}
            <form onSubmit={(e) => { e.preventDefault(); handleUpdateProduct(); }} className="space-y-4">
              
              {/* اسم المنتج */}
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

              {/* السعر */}
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

              {/* الوصف */}
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

              {/* الفئة */}
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

              {/* الموقع */}
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

              {/* رفع الصورة */}
              <div>
                <label className="block text-gray-700 dark:text-gray-200 text-sm font-medium mb-2">
                  تغيير صورة المنتج (اختياري)
                </label>
                
                <div className="flex items-start gap-3 mb-3">
                  {/* عرض الصورة الحالية */}
                  <Image
                    src={product.image_urls?.[0] || "/placeholder-image.jpg"}
                    alt="الصورة الحالية"
                    width={64}
                    height={64}
                    className="rounded-lg object-cover"
                    unoptimized={product.image_urls?.[0]?.startsWith('http')}
                  />
                  <div className="flex-1 min-w-0">
                    {/* حقل اختيار الصورة - التحقق من النوع والحجم يتم من Supabase */}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="w-full text-sm text-gray-600 dark:text-gray-300 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 dark:file:bg-blue-900/30 file:text-blue-700 dark:file:text-blue-400 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/50"
                      disabled={loading}
                    />
                    {imageFile && (
                      <p className="text-green-600 dark:text-green-400 text-xs mt-1 truncate">
                        تم اختيار: {imageFile.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* أزرار الإجراءات */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex-shrink-0 bg-white dark:bg-gray-900">
          <div className="flex gap-3">
            {/* زر حفظ التعديلات */}
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

            {/* زر الإلغاء */}
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