"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Edit3, ArrowRight } from "lucide-react";
import { getCurrentUser } from "../../utils/auth";
import ProfileEditForm from "../components/ProfileEditForm";
import AppLayout from "../components/AppLayout";

export default function SettingsPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  // الحالات الخاصة بالصفحة فقط
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showProfileEdit, setShowProfileEdit] = useState(false);

  // التحقق من المصادقة وجلب بيانات المستخدم
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

      setUser(userProfile || currentUser);
      setLoading(false);
    };

    checkAuth();
  }, [supabase, router]);

  const handleProfileUpdate = (updatedProfile) => {
    setUser(updatedProfile);
    setShowProfileEdit(false);
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

  return (
    <AppLayout>
      <div className="p-6 max-w-4xl mx-auto">
        {!showProfileEdit ? (
          <>
            {/* Profile Section */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
              <div className="flex items-center gap-4 mb-6">
                <img
                  src={user.avatar_url || "/avatar.svg"}
                  alt="صورة المستخدم"
                  className="w-16 h-16 rounded-full border-4 object-cover"
                  style={{ borderColor: "#1877F2" }}
                  onError={(e) => {
                    e.target.src = "/avatar.svg";
                  }}
                />
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    {user.full_name || "المستخدم"}
                  </h2>
                  <p className="text-gray-600">{user.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 mb-1">
                    رقم الهاتف
                  </h3>
                  <p className="text-gray-900">{user.phone || "غير محدد"}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 mb-1">
                    الموقع
                  </h3>
                  <p className="text-gray-900">
                    {user.location || "غير محدد"}
                  </p>
                </div>
              </div>
            </div>

            {/* Settings Options */}
            <div className="bg-white rounded-2xl border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800">
                  إعدادات الحساب
                </h2>
              </div>

              <div className="p-6">
                <button
                  onClick={() => setShowProfileEdit(true)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors border border-gray-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Edit3 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="text-right">
                      <h3 className="font-semibold text-gray-900">
                        تحرير الملف الشخصي
                      </h3>
                      <p className="text-sm text-gray-600">
                        قم بتحديث معلوماتك الشخصية
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 rotate-180" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200">
            <ProfileEditForm
              user={user}
              onClose={() => setShowProfileEdit(false)}
              onUpdate={handleProfileUpdate}
              supabase={supabase}
            />
          </div>
        )}
      </div>
    </AppLayout>
  );
}