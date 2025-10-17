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
        const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
        if (authError || !currentUser) return router.push("/");

        const { data: userProfile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", currentUser.id)
          .maybeSingle();

        setUser(userProfile || currentUser);
      } catch (error) {
        router.push("/");
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [supabase, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading || !user) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Logout Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6">
            <h3 className="text-xl font-bold mb-2">تسجيل الخروج</h3>
            <p className="text-gray-600 mb-6">هل أنت متأكد من تسجيل الخروج؟</p>
            <div className="flex gap-3">
              <button
                onClick={() => { handleLogout(); setShowLogoutConfirm(false); }}
                className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600"
              >
                تأكيد
              </button>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 border py-2 rounded-lg hover:bg-gray-50"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Desktop */}
      <div className="hidden md:block">
        {/* Sidebar */}
        <div className="fixed top-[73px] right-[80px] w-72 h-[calc(100vh-73px)] bg-white border-l flex flex-col z-10">
          <div className="p-6 border-b">
            <h1 className="text-2xl font-bold">الإعدادات</h1>
          </div>
          
          <div className="flex-1 p-4">
            <button className="w-full flex items-center justify-center gap-2 p-3 bg-gray-100 hover:bg-gray-200 rounded-lg">
              <Edit3 className="w-5 h-5" />
              <span>تحرير الملف الشخصي</span>
            </button>
          </div>

          <div className="border-t p-4">
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full flex items-center justify-center gap-2 p-3 text-red-600 hover:bg-red-50 rounded-lg"
            >
              <LogOut className="w-5 h-5" />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="mr-72">
          <ProfileEditForm user={user} onClose={() => {}} onUpdate={setUser} supabase={supabase} />
        </div>
      </div>
      
      {/* Mobile */}
      <div className="md:hidden">
        {!showMobileEdit ? (
          <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">الإعدادات</h1>
            <div className="bg-white rounded-lg border divide-y">
              <button
                onClick={() => setShowMobileEdit(true)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <Edit3 className="w-5 h-5 text-gray-600" />
                  <span>تحرير الملف الشخصي</span>
                </div>
                <ChevronLeft className="w-5 h-5 text-gray-400" />
              </button>

              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="w-full flex items-center justify-between p-4 hover:bg-red-50"
              >
                <div className="flex items-center gap-3">
                  <LogOut className="w-5 h-5 text-red-600" />
                  <span className="text-red-600">تسجيل الخروج</span>
                </div>
                <ChevronLeft className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>
        ) : (
          <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
            <div className="bg-white border-b p-4 flex items-center justify-between sticky top-0">
              <button onClick={() => setShowMobileEdit(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-6 h-6" />
              </button>
              <h2 className="text-lg font-bold">تحرير الملف الشخصي</h2>
              <div className="w-10"></div>
            </div>
            <ProfileEditForm user={user} onClose={() => setShowMobileEdit(false)} onUpdate={setUser} supabase={supabase} />
          </div>
        )}
      </div>
    </AppLayout>
  );
}