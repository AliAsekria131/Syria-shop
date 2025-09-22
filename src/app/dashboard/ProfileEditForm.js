"use client";
import React from "react";
import { useEffect, useState, useCallback } from "react";
import {
  X,
} from "lucide-react";

// مكون تعديل الملف الشخصي - محسن
export default function ProfileEditForm({ user, onClose, onUpdate, supabase }) {
  const [formData, setFormData] = useState({
    fullName: user.full_name || "",
    phone: user.phone || "",
    location: user.location || "",
  });
  const [avatarFile, setAvatarFile] = useState(null);
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
      const formData = new FormData();
      formData.append("image", file);
      const response = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "فشل رفع الصورة");
      }
      return result.url;
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

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
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
        <img
          src={
            avatarFile
              ? URL.createObjectURL(avatarFile)
              : user.avatar_url || "/avatar.svg"
          }
          alt="avatar preview"
          className="w-24 h-24 rounded-full border-4 object-cover bg-white"
          style={{ borderColor: "#1877F2" }}
        />
        <label className="cursor-pointer">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setAvatarFile(e.target.files[0]);
              }
            }}
            className="hidden"
          />
          <span
            className="px-4 py-2 rounded-lg font-medium transition-colors hover:opacity-90"
            style={{ backgroundColor: "#E8F4FD", color: "#1877F2" }}
          >
            تغيير الصورة
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
            onChange={(e) => handleInputChange("fullName", e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
            style={{ focusRingColor: "#1877F2" }}
            placeholder="أدخل اسمك الكامل"
          />
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2">
            رقم الهاتف
          </label>
          <input
            type="text"
            value={formData.phone}
            onChange={(e) => handleInputChange("phone", e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
            style={{ focusRingColor: "#1877F2" }}
            placeholder="09XXXXXXXX"
          />
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2">
            الموقع
          </label>
          <select
            value={formData.location}
            onChange={(e) => handleInputChange("location", e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent bg-white"
            style={{ focusRingColor: "#1877F2" }}
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
        <button
          onClick={onClose}
          disabled={loading}
          className="flex-1 py-3 rounded-lg font-medium transition-colors border border-gray-300 hover:bg-gray-50"
        >
          إلغاء
        </button>
      </div>
    </div>
  );
}
