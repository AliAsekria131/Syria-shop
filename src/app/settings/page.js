// src/app/settings/page.js
"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Edit3, LogOut, X, ChevronLeft } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import ProfileEditForm from "@/components/ProfileEditForm";

const supabase = createClient();

function LogoutModal({ onConfirm, onCancel }) {
  return (
    // bg-black bg-opacity-50 -> bg-black/50 dark:bg-white/10
    <div className="fixed inset-0 bg-black/50 dark:bg-white/10 z-50 flex items-center justify-center p-4">
      {/* bg-white -> dark:bg-gray-900 */}
      <div className="bg-white dark:bg-gray-900 rounded-xl max-w-sm w-full p-6">
        {/* H3 text: Add text-gray-900 dark:text-white for robust contrast */}
        <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">تسجيل الخروج</h3>
        {/* text-gray-600 -> dark:text-gray-300 */}
        <p className="text-gray-600 dark:text-gray-300 mb-6">هل أنت متأكد من تسجيل الخروج؟</p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            // الألوان الملونة لا تتغير
            className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600"
          >
            تأكيد
          </button>
          <button
            onClick={onCancel}
            // border (assumed border-gray-300) -> dark:border-gray-600, hover:bg-gray-50 -> dark:hover:bg-gray-800
            className="flex-1 border border-gray-300 dark:border-gray-600 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-white"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}

function DesktopSettings({ user, onUpdate, onLogout }) {
	const router = useRouter();
  return (
    <div className="hidden md:block">
      {/* bg-white -> dark:bg-gray-900, border-l (assumed border-gray-200) -> dark:border-gray-700 */}
      <div className="fixed top-[60px] right-[64px] w-72 h-[calc(100vh-60px)] bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 flex flex-col justify-between z-10">

		<div>
		
		    {/* border-b (assumed border-gray-200) -> dark:border-gray-700 */}
		    <div className="p-2 border-b border-gray-200 dark:border-gray-700">
              {/* Add text-gray-900 dark:text-white */}
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">الإعدادات</h1>
            </div>
		
            <div className=" p-3 pb-0">
              <button 
                // bg-gray-100 -> dark:bg-gray-800, hover:bg-gray-200 -> dark:hover:bg-gray-700
                className="w-full flex items-center justify-center gap-2 p-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-900 dark:text-white"
                onClick={() => setShowEdit(true)}
              >
                <Edit3 className="w-5 h-5" />
                <span>تحرير الملف الشخصي</span>
              </button>
            </div>
		
		    <div className=" p-3 pd-0">
              <button 
                // bg-gray-100 -> dark:bg-gray-800, hover:bg-gray-200 -> dark:hover:bg-gray-700
                className="w-full flex items-center justify-center gap-2 p-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-900 dark:text-white"
                onClick={() => router.push("/about")}
              >
                <Edit3 className="w-5 h-5" />
                <span>من نحن</span>
              </button>
		      
            </div>
		</div>
        {/* border-t (assumed border-gray-200) -> dark:border-gray-700 */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <button
            onClick={onLogout}
            // الألوان الملونة لا تتغير
            className="w-full flex items-center justify-center gap-2 p-3 text-red-600 hover:bg-red-50 rounded-lg"
          >
            <LogOut className="w-5 h-5" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </div>
      
      <div className="mr-72">
        <ProfileEditForm user={user} onClose={() => {}} onUpdate={onUpdate} supabase={supabase} />
      </div>
    </div>
  );
}

function MobileSettings({ user, onUpdate, onLogout }) {
  const [showEdit, setShowEdit] = useState(false);
  const router = useRouter();

  if (showEdit) {
    return (
      // bg-white -> dark:bg-gray-900
      <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 overflow-y-auto">
        {/* bg-white -> dark:bg-gray-900, border-b (assumed border-gray-200) -> dark:border-gray-700 */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-2 flex items-center justify-between sticky top-0">
          {/* hover:bg-gray-100 -> dark:hover:bg-gray-700. Add text-gray-900 dark:text-white to button */}
          <button onClick={() => setShowEdit(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
            <X className="w-6 h-6" />
          </button>
          {/* Add text-gray-900 dark:text-white */}
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">تحرير الملف الشخصي</h2>
          <div className="w-10"></div>
        </div>
        <ProfileEditForm user={user} onClose={() => setShowEdit(false)} onUpdate={onUpdate} supabase={supabase} />
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Add text-gray-900 dark:text-white */}
      <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">الإعدادات</h1>
      {/* bg-white -> dark:bg-gray-900, border (assumed border-gray-200) -> dark:border-gray-700, Add dark:divide-gray-700 */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 divide-y dark:divide-gray-700">
        <button
          onClick={() => setShowEdit(true)}
          // hover:bg-gray-50 -> dark:hover:bg-gray-800. Add text-gray-900 dark:text-white
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-white"
        >
          <div className="flex items-center gap-3">
            {/* text-gray-600 -> dark:text-gray-300 */}
            <Edit3 className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            <span>تحرير الملف الشخصي</span>
          </div>
          {/* text-gray-400 -> dark:text-gray-500 */}
          <ChevronLeft className="w-5 h-5 text-gray-400 dark:text-gray-500" />
        </button>
		
		<button
          onClick={() => router.push("/about")}
          // hover:bg-gray-50 -> dark:hover:bg-gray-800. Add text-gray-900 dark:text-white
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-white"
        >
          <div className="flex items-center gap-3">
            {/* text-gray-600 -> dark:text-gray-300 */}
            <Edit3 className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            <span>من نحن</span>
          </div>
          {/* text-gray-400 -> dark:text-gray-500 */}
          <ChevronLeft className="w-5 h-5 text-gray-400 dark:text-gray-500" />
        </button>

        <button
          onClick={onLogout}
          // hover:bg-red-50 لا يتغير
          className="w-full flex items-center justify-between p-4 hover:bg-red-50"
        >
          <div className="flex items-center gap-3">
            {/* text-red-600 لا يتغير */}
            <LogOut className="w-5 h-5 text-red-600" />
            {/* text-red-600 لا يتغير */}
            <span className="text-red-600">تسجيل الخروج</span>
          </div>
          {/* text-gray-400 -> dark:text-gray-500 */}
          <ChevronLeft className="w-5 h-5 text-gray-400 dark:text-gray-500" />
        </button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user: currentUser }, error } = await supabase.auth.getUser();
        if (error || !currentUser) {
          router.push("/");
          return;
        }

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
  }, [router]);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    router.push("/");
  }, [router]);

  const confirmLogout = useCallback(() => {
    handleLogout();
    setShowLogoutConfirm(false);
  }, [handleLogout]);

  if (loading || !user) {
    return (
      <AppLayout>
        {/* لا يوجد تغييرات ضرورية هنا (border-blue-500 هو لون ملون) */}
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {showLogoutConfirm && (
        <LogoutModal 
          onConfirm={confirmLogout} 
          onCancel={() => setShowLogoutConfirm(false)} 
        />
      )}
      
      <DesktopSettings 
        user={user} 
        onUpdate={setUser} 
        onLogout={() => setShowLogoutConfirm(true)} 
      />
      
      <div className="md:hidden">
        <MobileSettings 
          user={user} 
          onUpdate={setUser} 
          onLogout={() => setShowLogoutConfirm(true)} 
        />
      </div>
    </AppLayout>
  );
}