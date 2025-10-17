// src/app/components/AppLayout.js
"use client";

import { createClient } from '../../../lib/supabase';
import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from 'next/image';
import { Home, Search, Plus, Settings, ChevronDown, LogOut, PlusCircle, Heart, User } from "lucide-react";


import MessagesIcon from './MessagesIcon';
import MessageToast from './MessageToast';

export default function AppLayout({ children }) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const pathname = usePathname();
  
 
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [searchInputValue, setSearchInputValue] = useState("");
  
  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ التحقق من المصادقة مع cleanup
  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        const { data: { user: authUser }, error } = await supabase.auth.getUser();
        
        if (!mounted) return;

        if (error) {
            console.error("Auth error:", error?.message);
          return;
        }
		
        const { data: userProfile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authUser.id)
          .single();

        if (!mounted) return;

        if (profileError) {
          if (process.env.NODE_ENV === 'development') {
            console.error("Profile fetch error:", profileError.message);
          }
        }

        setUser(userProfile);
        setIsLoading(false);
      } catch (err) {
        if (!mounted) return;
        if (process.env.NODE_ENV === 'development') {
          console.error("Unexpected error:", err);
        }
        setAuthError("حدث خطأ في التحقق من الهوية");
        setIsLoading(false);
      }
    };

    checkAuth();
	
	
    return () => {
      mounted = false;
    };
  }, [supabase, router]);
///////////////////////////////////////
  // ✅ إدارة النقر خارج القوائم مع cleanup
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserMenu && !event.target.closest(".user-menu-container")) {
        setShowUserMenu(false);
      }
      if (showSettingsMenu && !event.target.closest(".settings-menu-container")) {
        setShowSettingsMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showUserMenu, showSettingsMenu]);
/////////////////////////////////////
  // ✅ معالجة البحث بشكل آمن
  const handleSearch = useCallback((e) => {
    e.preventDefault();
    const sanitized = searchInputValue.trim().substring(0, 100);
    if (sanitized) {
      router.push(`/search?q=${encodeURIComponent(sanitized)}`);
    } else {
      router.push("/search");
    }
  }, [searchInputValue, router]);
////////////////////////////////////
  // ✅ تسجيل الخروج الآمن
  const handleSignOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      router.replace("/auth");
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Sign out error:", err);
      }
    }
  }, [supabase, router]);
///////////////////////////////////
  const isActive = useCallback((path) => pathname === path, [pathname]);
  // شاشة الخطأ
  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-red-600">{authError}</p>
          <button
            onClick={() => router.replace("/auth")}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            العودة لتسجيل الدخول
          </button>
        </div>
      </div>
    );
  }

  // شاشة التحميل
  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white" dir="rtl" lang="ar">
      {/* Desktop Sidebar */}
      <div className="hidden md:block fixed right-0 top-0 h-full w-20 bg-white border-l border-gray-200 z-50">
        <div className="flex flex-col items-center py-6 h-full">
          <button 
            onClick={() => router.push("/main")} 
            className="mb-8"
            aria-label="الصفحة الرئيسية"
          >
            <Image
              src="/logo (6).jpeg"
              alt="شعار الموقع"
              width={44}
              height={44}
              className="rounded-xl object-cover"
              priority
            />
          </button>
          
          <nav className="flex flex-col gap-4 mb-auto" aria-label="القائمة الرئيسية">
            <button
              onClick={() =>  router.push("/main")}
              className={`p-3 rounded-xl transition-colors ${
                isActive("/main") 
                  ? "bg-gray-100 text-black" 
                  : "text-gray-600 hover:bg-gray-50"
              }`}
              aria-label="الصفحة الرئيسية"
              aria-current={isActive("/main") ? "page" : undefined}
            >
              <Home className="w-6 h-6" />
            </button>
            
            <button
              onClick={() => router.push("/search")}
              className={`p-3 rounded-xl transition-colors ${
                isActive("/search") 
                  ? "bg-gray-100 text-black" 
                  : "text-gray-600 hover:bg-gray-50"
              }`}
              aria-label="البحث"
              aria-current={isActive("/search") ? "page" : undefined}
            >
              <Search className="w-6 h-6" />
            </button>
            
            <button
              onClick={() => router.push("/add-product")}
              className={`p-3 rounded-xl transition-colors ${
                isActive("/add-product") 
                  ? "bg-gray-100 text-black" 
                  : "text-gray-600 hover:bg-gray-50"
              }`}
              aria-label="إضافة منتج"
              aria-current={isActive("/add-product") ? "page" : undefined}
            >
              <Plus className="w-6 h-6" />
            </button>
            
            <button
              onClick={() => router.push("/favorites")}
              className={`p-3 rounded-xl transition-colors ${
                isActive("/favorites") 
                  ? "bg-gray-100 text-black" 
                  : "text-gray-600 hover:bg-gray-50"
              }`}
              aria-label="المفضلة"
              aria-current={isActive("/favorites") ? "page" : undefined}
            >
              <Heart className="w-6 h-6" />
            </button>
			

      
    
          </nav>
          
          <div className="relative settings-menu-container">
            <button
              onClick={() => setShowSettingsMenu(!showSettingsMenu)}
              className="p-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              aria-label="الإعدادات"
              aria-expanded={showSettingsMenu}
            >
              <Settings className="w-6 h-6" />
            </button>
            
            {showSettingsMenu && (
              <div className="absolute right-0 bottom-16 w-80 bg-white rounded-xl shadow-lg border py-2 z-50">
                <button
                  onClick={() => {
                    router.push("/settings");
                    setShowSettingsMenu(false);
                  }}
                  className="w-full px-4 py-3 text-right hover:bg-gray-50 transition-colors flex items-center gap-3"
                >
                  <Settings className="w-5 h-5 text-gray-500" />
                  <span>الإعدادات</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="md:mr-20">
        {/* Desktop Header */}
        <header className="hidden md:block sticky top-0 z-40 bg-white border-b border-gray-200">
          <div className="px-3 py-3">
            <div className="flex items-center gap-4">
              <form onSubmit={handleSearch} className="flex-1 relative">
                <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                <input
                  type="search"
                  placeholder="ابحث في المنتجات..."
                  value={searchInputValue}
                  onChange={(e) => setSearchInputValue(e.target.value)}
                  maxLength={100}
                  className="w-full pr-12 pl-6 py-4 bg-gray-50 hover:bg-gray-100 focus:bg-white transition-colors rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none"
                  aria-label="البحث في المنتجات"
                />
              </form>
              
              <div className="flex relative user-menu-container gap-1 items-center">
                <button 
                  onClick={() => router.push("/dashboard")}
                  aria-label="الملف الشخصي"
                  className="focus:outline-none"
                >
                  <Image
                    src={user.avatar_url || "/avatar.svg"}
                    alt="صورة المستخدم"
                    width={40}
                    height={40}
                    className="rounded-full border-2 border-gray-200 object-cover w-10 h-10 hover:opacity-90 transition-opacity"
                    priority
                  />
                </button>
                
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-2 rounded-2xl hover:bg-gray-100 transition-colors focus:outline-none"
                  aria-label="قائمة المستخدم"
                  aria-expanded={showUserMenu}
                >
				<ChevronDown className="w-4 h-4 text-gray-600" />
				  
                </button>
                
                {showUserMenu && (
                  <div className="absolute left-0 top-12 w-48 bg-white rounded-xl shadow-lg border py-2 z-50 text-right">
                    <button
                      onClick={() => {
                        router.push("/dashboard");
                        setShowUserMenu(false);
                      }}
                      className="w-full px-4 py-3 text-right hover:bg-gray-50 transition-colors flex items-center gap-3"
                    >
                      <User className="w-5 h-5 text-gray-500" />
                      <span>الملف الشخصي</span>
                    </button>
                    
                    <hr className="my-1 border-gray-200" />
                    
                    <button
                      onClick={handleSignOut}
                      className="w-full px-4 py-3 text-right hover:bg-gray-50 transition-colors flex items-center gap-3 text-red-600 font-medium"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>تسجيل الخروج</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
		  <MessagesIcon currentUser={user} />
        </header>
        
        <main>{children}</main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav 
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50 h-[70px]"
        aria-label="القائمة السفلية"
      >
        <div className="flex items-center justify-around h-full">
          <button
            onClick={() => router.push("/main")}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
              isActive("/main") 
                ? "bg-[#3f47cc] text-white" 
                : "text-gray-600"
            }`}
            aria-label="الرئيسية"
            aria-current={isActive("/main") ? "page" : undefined}
          >
            <Home className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => router.push("/search")}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
              isActive("/search") 
                ? "bg-[#3f47cc] text-white" 
                : "text-gray-600"
            }`}
            aria-label="البحث"
            aria-current={isActive("/search") ? "page" : undefined}
          >
            <Search className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => router.push("/add-product")}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg ${
              isActive("/add-product") 
                ? "bg-[#3f47cc] text-white" 
                : "text-gray-600"
            }`}
            aria-label="إضافة"
            aria-current={isActive("/add-product") ? "page" : undefined}
          >
            <PlusCircle className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => router.push("/favorites")}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
              isActive("/favorites") 
                ? "bg-[#3f47cc] text-white" 
                : "text-gray-600"
            }`}
            aria-label="المفضلة"
            aria-current={isActive("/favorites") ? "page" : undefined}
          >
            <Heart className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => router.push("/dashboard")}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
              isActive("/dashboard") 
                ? "bg-[#3f47cc] text-white border border-[#3f47cc]" 
                : "text-gray-600"
            }`}
            aria-label="حسابي"
            aria-current={isActive("/dashboard") ? "page" : undefined}
          >
            <User className="w-5 h-5" />
          </button>
        </div>
		<MessagesIcon currentUser={user} isMobile={true} />
      </nav>
	  
	  <MessageToast currentUser={user} />
	  
      
      {/* Mobile Navigation Spacer */}
      <div className="md:hidden h-20" aria-hidden="true"></div>
    </div>
  );
}