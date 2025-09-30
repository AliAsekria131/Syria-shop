"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Edit3, ArrowRight, LogOut, X, ChevronLeft } from "lucide-react";
import { getCurrentUser } from "../../utils/auth";
import AppLayout from "../components/AppLayout";

export default function SettingsPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("profile");
  const [showMobileEdit, setShowMobileEdit] = useState(false);
  
  // حقول التعديل
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    location: "",
    avatar_url: "",
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await getCurrentUser(supabase);
      if (!currentUser) {
        router.push("/");
        return;
      }

      const { data: userProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();

      const userData = userProfile || currentUser;
      setUser(userData);
      setFormData({
        full_name: userData.full_name || "",
        phone: userData.phone || "",
        location: userData.location || "",
        avatar_url: userData.avatar_url || "",
      });
      setLoading(false);
    };

    checkAuth();
  }, [supabase, router]);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from("avatars")
        .upload(fileName, file);

      if (error) throw error;

      const { data: publicData } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      setFormData((prev) => ({ ...prev, avatar_url: publicData.publicUrl }));
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("حدث خطأ في رفع الصورة");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update(formData)
        .eq("id", user.id);

      if (error) throw error;

      setUser({ ...user, ...formData });
      alert("تم حفظ التغييرات بنجاح");
      setShowMobileEdit(false);
    } catch (error) {
      console.error("Error saving:", error);
      alert("حدث خطأ في حفظ التغييرات");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm("هل أنت متأكد من تسجيل الخروج؟")) {
      await supabase.auth.signOut();
      router.push("/");
    }
  };

  if (!user || loading) {
    return (
      <AppLayout>
        <div className="p-4 md:p-6">
          <div className="flex items-center justify-center pt-20">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">جاري التحميل...</p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // محتوى التعديل
  const EditContent = () => (
    <div className="space-y-6">
      {/* صورة الملف الشخصي */}
      <div className="text-center">
        <div className="relative inline-block">
          <img
            src={formData.avatar_url || "/avatar.svg"}
            alt="صورة المستخدم"
            className="w-24 h-24 rounded-full border-2 border-gray-200 object-cover mx-auto"
            onError={(e) => {
              e.target.src = "/avatar.svg";
            }}
          />
          <label className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full cursor-pointer hover:bg-blue-600">
            <Edit3 className="w-4 h-4" />
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
        </div>
        {uploading && (
          <p className="text-sm text-gray-500 mt-2">جاري رفع الصورة...</p>
        )}
      </div>

      {/* الاسم الكامل */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          الاسم الكامل
        </label>
        <input
          type="text"
          value={formData.full_name}
          onChange={(e) =>
            setFormData({ ...formData, full_name: e.target.value })
          }
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="أدخل اسمك الكامل"
        />
      </div>

      {/* البريد الإلكتروني */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          البريد الإلكتروني
        </label>
        <input
          type="email"
          value={user.email}
          disabled
          className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          لا يمكن تغيير البريد الإلكتروني
        </p>
      </div>

      {/* رقم الهاتف */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          رقم الهاتف
        </label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) =>
            setFormData({ ...formData, phone: e.target.value })
          }
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="أدخل رقم هاتفك"
        />
      </div>

      {/* الموقع */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          الموقع
        </label>
        <input
          type="text"
          value={formData.location}
          onChange={(e) =>
            setFormData({ ...formData, location: e.target.value })
          }
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="أدخل موقعك"
        />
      </div>
    </div>
  );

  return (
    <AppLayout>
      {/* Desktop Layout */}
      <div className="hidden md:flex h-screen">
        {/* Sidebar */}
        <div className="w-72 bg-white flex flex-col ">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">الإعدادات</h1>
          </div>

          <div className="flex-1 overflow-y-auto">
            <button
              onClick={() => setSelectedTab("profile")}
              className={`w-full flex items-center justify-between p-4 transition-colors ${
                selectedTab === "profile"
                  ? "bg-gray-100 border-r-4 border-blue-500"
                  : "hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <Edit3 className="w-5 h-5 text-gray-600" />
                <span className="font-medium text-gray-900">
                  تحرير الملف الشخصي
                </span>
              </div>
              <ChevronLeft className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col bg-gray-50 h-[calc(100vh+150px)]">
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-2xl">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                تحرير الملف الشخصي
              </h2>
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <EditContent />
              </div>
            </div>
          </div>

{/* Fixed Save Button */}
<div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-10">
  <div className="max-w-2xl mx-auto text-center">
    <button
      onClick={handleSave}
      disabled={saving}
      className="w-50 bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50"
    >
      {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
    </button>
  </div>
</div>
        </div>
      </div>

      {/* Mobile Layout */}
<div className="md:hidden">
  {!showMobileEdit ? (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">الإعدادات</h1>

      <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
        <button
          onClick={() => setShowMobileEdit(true)}
          className="w-full flex items-center justify-between p-4"
        >
          <div className="flex items-center gap-3">
            <Edit3 className="w-5 h-5 text-gray-600" />
            <span className="font-medium text-gray-900">
              تحرير الملف الشخصي
            </span>
          </div>
          <ChevronLeft className="w-5 h-5 text-gray-400" />
        </button>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-between p-4"
        >
          <div className="flex items-center gap-3">
            <LogOut className="w-5 h-5 text-red-600" />
            <span className="font-medium text-red-600">
              تسجيل الخروج
            </span>
          </div>
          <ChevronLeft className="w-5 h-5 text-gray-400" />
        </button>
      </div>
    </div>
  ) : (
    <div className="fixed inset-0 bg-white z-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <button
          onClick={() => setShowMobileEdit(false)}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <X className="w-6 h-6" />
        </button>
        <h2 className="text-lg font-bold text-gray-900">
          تحرير الملف الشخصي
        </h2>
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-blue-500 font-medium disabled:opacity-50 px-2"
        >
          {saving ? "..." : "حفظ"}
        </button>
      </div>

      {/* Content - Scrollable */}
      <div className="h-[calc(100vh-64px)] overflow-y-auto">
        <div className="p-4 pb-8 h-[calc(100vh+64px)]">
          <EditContent />
        </div>
      </div>
    </div>
  )}
</div>
    </AppLayout>
  );
}