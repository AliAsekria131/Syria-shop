// src/app/settings/page.js
"use client";

import { createClient } from "../../../lib/supabase";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Edit3, LogOut, X, ChevronLeft } from "lucide-react";
import AppLayout from "../components/AppLayout";
import ProfileEditForm from "../components/ProfileEditForm";

const supabase = createClient();

function LogoutModal({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-sm w-full p-6">
        <h3 className="text-xl font-bold mb-2">تسجيل الخروج</h3>
        <p className="text-gray-600 mb-6">هل أنت متأكد من تسجيل الخروج؟</p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600"
          >
            تأكيد
          </button>
          <button
            onClick={onCancel}
            className="flex-1 border py-2 rounded-lg hover:bg-gray-50"
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
      <div className="fixed top-[60px] right-[64px] w-72 h-[calc(100vh-60px)] bg-white border-l flex flex-col justify-between z-10">

		<div>
		
		        <div className="p-2 border-b">
          <h1 className="text-2xl font-bold">الإعدادات</h1>
        </div>
		
        <div className=" p-3 pb-0">
          <button 
		  className="w-full flex items-center justify-center gap-2 p-3 bg-gray-100 hover:bg-gray-200 rounded-lg"
		  onClick={() => setShowEdit(true)}
		  >
            <Edit3 className="w-5 h-5" />
            <span>تحرير الملف الشخصي</span>
          </button>
        </div>
		
		        <div className=" p-3 pd-0">
          <button 
		  className="w-full flex items-center justify-center gap-2 p-3 bg-gray-100 hover:bg-gray-200 rounded-lg"
		  onClick={() => router.push("/about")}
		  >
            <Edit3 className="w-5 h-5" />
            <span>من نحن</span>
          </button>
		  
        </div>
		</div>
        <div className="border-t p-4">
          <button
            onClick={onLogout}
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
      <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
        <div className="bg-white border-b p-2 flex items-center justify-between sticky top-0">
          <button onClick={() => setShowEdit(false)} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-6 h-6" />
          </button>
          <h2 className="text-lg font-bold">تحرير الملف الشخصي</h2>
          <div className="w-10"></div>
        </div>
        <ProfileEditForm user={user} onClose={() => setShowEdit(false)} onUpdate={onUpdate} supabase={supabase} />
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">الإعدادات</h1>
      <div className="bg-white rounded-lg border divide-y">
        <button
          onClick={() => setShowEdit(true)}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
        >
          <div className="flex items-center gap-3">
            <Edit3 className="w-5 h-5 text-gray-600" />
            <span>تحرير الملف الشخصي</span>
          </div>
          <ChevronLeft className="w-5 h-5 text-gray-400" />
        </button>
		
		<button
          onClick={() => router.push("/about")}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
        >
          <div className="flex items-center gap-3">
            <Edit3 className="w-5 h-5 text-gray-600" />
            <span>من نحن</span>
          </div>
          <ChevronLeft className="w-5 h-5 text-gray-400" />
        </button>

        <button
          onClick={onLogout}
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