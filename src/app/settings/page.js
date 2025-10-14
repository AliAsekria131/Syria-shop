"use client";

import { createClient } from "../../../lib/supabase";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Edit3, LogOut, X, ChevronLeft } from "lucide-react";
import AppLayout from "../components/AppLayout";
import ProfileEditForm from "../components/ProfileEditForm";

export default function SettingsPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMobileEdit, setShowMobileEdit] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { user: currentUser },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !currentUser) {
          router.push("/");
          return;
        }

        const { data: userProfile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", currentUser.id)
          .maybeSingle();

        if (profileError && profileError.code !== "PGRST116") {
          console.error("Profile fetch error:", profileError);
        }

        setUser(userProfile || currentUser);
      } catch (error) {
        console.error("Auth check error:", error);
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [supabase, router]);

  const handleUpdate = (updatedProfile) => {
    setUser(updatedProfile);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };


  // عرض شاشة تحميل إذا كان loading أو user غير موجود
  if (loading || !user) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">جاري التحميل...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              تسجيل الخروج
            </h3>
            <p className="text-gray-600 mb-6">هل أنت متأكد من تسجيل الخروج؟</p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  handleLogout();
                  setShowLogoutConfirm(false);
                }}
                className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition-colors font-medium"
              >
                تأكيد
              </button>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Layout */}
      <div className="hidden md:flex h-screen">
        {/* Sidebar */}
        <div className="w-72 bg-white flex flex-col border-l border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">الإعدادات</h1>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="w-full flex items-center justify-between p-4 bg-gray-100 border-r-4 border-blue-500">
              <div className="flex items-center gap-3">
                <Edit3 className="w-5 h-5 text-gray-600" />
                <span className="font-medium text-gray-900">
                  تحرير الملف الشخصي
                </span>
              </div>
              <ChevronLeft className="w-5 h-5 text-gray-400" />
            </div>
          </div>

          {/* Desktop Logout Button */}
          <div className="border-t border-gray-200 p-4">
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full flex items-center justify-center gap-2 p-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
            >
              <LogOut className="w-5 h-5" />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col bg-gray-50 overflow-y-auto">
          <div className="p-8">
            <div className="max-w-2xl">
              <div className="bg-white rounded-lg border border-gray-200">
                <ProfileEditForm
                  user={user}
                  onClose={() => {}}
                  onUpdate={handleUpdate}
                  supabase={supabase}
                />
              </div>
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
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
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
                onClick={() => setShowLogoutConfirm(true)}
                className="w-full flex items-center justify-between p-4 hover:bg-red-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <LogOut className="w-5 h-5 text-red-600" />
                  <span className="font-medium text-red-600">تسجيل الخروج</span>
                </div>
                <ChevronLeft className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>
        ) : (
          <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
            <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-10">
              <button
                onClick={() => setShowMobileEdit(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="إغلاق"
              >
                <X className="w-6 h-6" />
              </button>
              <h2 className="text-lg font-bold text-gray-900">
                تحرير الملف الشخصي
              </h2>
              <div className="w-10"></div>
            </div>

            <ProfileEditForm
              user={user}
              onClose={() => setShowMobileEdit(false)}
              onUpdate={handleUpdate}
              supabase={supabase}
            />
          </div>
        )}
      </div>
    </AppLayout>
  );
}
