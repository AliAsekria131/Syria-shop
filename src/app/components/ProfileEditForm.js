"use client";
import React, { useState } from "react";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
  import Image from 'next/image';
export default function ProfileEditForm({ user, onClose, onUpdate, supabase }) {
	const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: user.full_name || "",
    phone: user.phone || "",
    location: user.location || "",
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(user.avatar_url || "/avatar.svg");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");


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

  const uploadAvatar = async (file) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar-${user.id}-${Date.now()}.${fileExt}`;
      
      const { error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw new Error(error.message || "فشل في رفع الصورة");
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      throw new Error("فشل في رفع الصورة: " + error.message);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError("");

    try {
      let avatar_url = user.avatar_url;

      if (avatarFile) {
        avatar_url = await uploadAvatar(avatarFile);
      }

      const { data: updatedProfile, error: updateError } = await supabase
        .from("profiles")
        .update({
          full_name: formData.fullName,
          phone: formData.phone,
          location: formData.location,
          avatar_url,
        })
        .eq("id", user.id)
        .select()
        .single();

      if (updateError) {
        throw new Error(updateError.message);
      }

      if (!updatedProfile) {
        throw new Error("فشل في تحديث البيانات");
      }

      onUpdate(updatedProfile);
      onClose();
    } catch (err) {
      console.error("Profile update error:", err);
      setError(err.message || "حدث خطأ أثناء الحفظ");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">تعديل الملف الشخصي</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-6 h-6 text-gray-500" />
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <div className="flex flex-col items-center gap-3 mb-6">

<Image
  src={previewUrl || "/avatar.svg"} // طريقة أفضل للتعامل مع الصور الاحتياطية
  alt="avatar preview"
  width={96} // يجب تحديد العرض
  height={96} // يجب تحديد الطول
  className="w-24 h-24 rounded-full border-4 object-cover bg-white"
  style={{ borderColor: "#1877F2" }}
/>
        <label className="cursor-pointer">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={loading}
          />
          <span
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              loading 
                ? "bg-gray-200 text-gray-400 cursor-not-allowed" 
                : "hover:opacity-90 cursor-pointer"
            }`}
            style={{ 
              backgroundColor: loading ? "#E5E7EB" : "#E8F4FD", 
              color: loading ? "#9CA3AF" : "#1877F2" 
            }}
          >
            {loading ? "جاري الرفع..." : "تغيير الصورة"}
          </span>
        </label>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2">
            الاسم الكامل
          </label>
          <input
            type="text"
            value={formData.fullName}
            onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="أدخل اسمك الكامل"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2">
            رقم الهاتف
          </label>
          <input
            type="text"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="09XXXXXXXX"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2">
            الموقع
          </label>
          <select
            value={formData.location}
            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
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
      </div>

      <div className="flex gap-3 mt-6">
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex-1 py-3 rounded-lg text-white font-medium transition-all"
          style={{ backgroundColor: loading ? "#8B9DC3" : "#1877F2" }}
        >
          {loading ? "جاري الحفظ..." : "حفظ التغييرات"}
        </button>
<button onClick={() => router.push('/main')} className="flex-1 ...">
  الرجوع للرئيسية
</button>
      </div>
    </div>
  );
}