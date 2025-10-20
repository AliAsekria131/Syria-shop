// src/app/components/AppLayout.js
"use client";

import { createClient } from "../../../lib/supabase";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import UserProfileMenu from "../components/UserProfileMenu";
import {
  Home,
  Search,
  Plus,
  Settings,
  PlusCircle,
  Heart,
  User,
} from "lucide-react";
import MessagesIcon from "./MessagesIcon";
import MessageToast from "./MessageToast";
import ThemeToggle from './ThemeToggle';

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
  const isSearchPage = pathname === "/search";
  const isChatPage = pathname === "/chat";


	function notPageAllow(){
		if(pathname.startsWith("/search") || pathname.startsWith("/chat"))
			return true
		else
			return false
	}
	
	
  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        const {
          data: { user: authUser },
          error,
        } = await supabase.auth.getUser();

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

        if (profileError && process.env.NODE_ENV === "development") {
          console.error("Profile fetch error:", profileError.message);
        }

        setUser(userProfile);
        setIsLoading(false);
      } catch (err) {
        if (!mounted) return;
        if (process.env.NODE_ENV === "development") {
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
  }, [supabase]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserMenu && !event.target.closest(".user-menu-container")) {
        setShowUserMenu(false);
      }
      if (
        showSettingsMenu &&
        !event.target.closest(".settings-menu-container")
      ) {
        setShowSettingsMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showUserMenu, showSettingsMenu]);

  const handleSearch = useCallback(
    (e) => {
      e.preventDefault();
      const sanitized = searchInputValue.trim().substring(0, 100);
      router.push(
        sanitized ? `/search?q=${encodeURIComponent(sanitized)}` : "/search"
      );
    },
    [searchInputValue, router]
  );

  const handleSignOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      router.replace("/auth");
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error("Sign out error:", err);
      }
    }
  }, [supabase, router]);

  const isActive = useCallback((path) => pathname === path, [pathname]);

  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">{authError}</p>
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

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const NavButton = ({ onClick, icon: Icon, label, path }) => (
    <button
      onClick={onClick}
      className={`p-2.5 rounded-lg transition-colors ${
        isActive(path)
          ? "bg-gray-100 dark:bg-gray-800 text-black dark:text-white"
          : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
      }`}
      aria-label={label}
      aria-current={isActive(path) ? "page" : undefined}
    >
      <Icon className="w-5 h-5" />
    </button>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900" dir="rtl" lang="ar">
      {/* Desktop Sidebar */}
      <div className="hidden md:block fixed right-0 top-0 h-full w-16 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 z-50">
        <div className="flex flex-col items-center py-4 h-full">
          {/* Logo */}
          <button
            onClick={() => router.push("/main")}
            className="mb-6"
            aria-label="الصفحة الرئيسية"
          >
            <Image
              src="/logo (6).jpeg"
              alt="شعار الموقع"
              width={36}
              height={36}
              className="rounded-lg object-cover"
              priority
            />
          </button>

          {/* Navigation Buttons */}
          <nav
            className="flex flex-col gap-3 mb-auto"
            aria-label="القائمة الرئيسية"
          >
            <NavButton
              onClick={() => router.push("/main")}
              icon={Home}
              label="الصفحة الرئيسية"
              path="/main"
            />
            <NavButton
              onClick={() => router.push("/search")}
              icon={Search}
              label="البحث"
              path="/search"
            />
            <NavButton
              onClick={() => router.push("/add-product")}
              icon={Plus}
              label="إضافة منتج"
              path="/add-product"
            />
            <NavButton
              onClick={() => router.push("/favorites")}
              icon={Heart}
              label="المفضلة"
              path="/favorites"
            />
          </nav>

          {/* Settings Menu */}
          <div className="flex flex-col justify-center relative settings-menu-container">
            <ThemeToggle />
            <button
              onClick={() => setShowSettingsMenu(!showSettingsMenu)}
              className="p-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="الإعدادات"
              aria-expanded={showSettingsMenu}
            >
              <Settings className="w-5 h-5" />
            </button>

            {showSettingsMenu && (
              <div className="absolute right-0 bottom-14 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700 py-2 z-50">
                <button
                  onClick={() => {
                    router.push("/settings");
                    setShowSettingsMenu(false);
                  }}
                  className="w-full px-4 py-2.5 text-right hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-3"
                >
                  <Settings className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  <span className="text-gray-900 dark:text-white">الإعدادات</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="md:mr-16">
        {/* Desktop Header */}
        <header className="hidden md:block sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          {!notPageAllow && (
            <div className="px-3 py-2.5">
              <div className="flex items-center gap-3">
                {/* Search Bar */}
                <form onSubmit={handleSearch} className="flex-1 relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4 pointer-events-none" />
                  <input
                    type="search"
                    placeholder="ابحث في المنتجات..."
                    value={searchInputValue}
                    onChange={(e) => setSearchInputValue(e.target.value)}
                    maxLength={100}
                    className="w-full pr-10 pl-4 py-2.5 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-white dark:focus:bg-gray-800 transition-colors rounded-lg border-2 border-gray-200 dark:border-gray-600 focus:border-blue-500 focus:outline-none text-sm text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                    aria-label="البحث في المنتجات"
                  />
                </form>

                {/* user menu */}
                <UserProfileMenu user={user} onSignOut={handleSignOut} />
              </div>
            </div>
          )}
          <MessagesIcon currentUser={user} />
        </header>

        <main>{children}</main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-4 py-2 z-50 h-[70px]"
        aria-label="القائمة السفلية"
      >
        <div className="flex items-center justify-around h-full">
          {[
            { path: "/main", icon: Home, label: "الرئيسية" },
            { path: "/search", icon: Search, label: "البحث" },
            { path: "/add-product", icon: PlusCircle, label: "إضافة" },
            { path: "/favorites", icon: Heart, label: "المفضلة" },
            { path: "/dashboard", icon: User, label: "حسابي" },
          ].map(({ path, icon: Icon, label }) => (
            <button
              key={path}
              onClick={() => router.push(path)}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                isActive(path) 
                  ? "bg-[#3f47cc] text-white" 
                  : "text-gray-600 dark:text-gray-300"
              }`}
              aria-label={label}
              aria-current={isActive(path) ? "page" : undefined}
            >
              <Icon className="w-5 h-5" />
            </button>
          ))}
        </div>
		{isChatPage &&(
			<MessagesIcon currentUser={user} isMobile={true} />)
			}
      </nav>

      <MessageToast currentUser={user} />
      <div className="md:hidden h-20" aria-hidden="true"></div>
    </div>
  );
}