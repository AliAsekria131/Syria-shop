"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    if (pathname !== "/") {
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        router.replace("/main");
        return;
      }

      setLoading(false);
    } catch (error) {
      console.error("Error checking auth:", error);
      setLoading(false);
    }
  };

  // التحقق من المصادقة بشكل مبسط
  useEffect(() => {
    checkAuth();
  }, [router, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 relative">
      {/* المحتوى الرئيسي */}
      <div className="relative h-[calc(100vh-52px)] flex items-center justify-center">
        {/* الخلفية */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 opacity-40" />

        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1200&auto=format&fit=crop&q=80"
            alt="تسوق ذكي"
            fill
            className="object-cover opacity-60"
            priority
            quality={80}
            sizes="100vw"
          />
        </div>

        {/* المحتوى */}
        <div className="relative z-10 text-center px-8 max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 drop-shadow-2xl leading-tight">
            اكتشف عالم التسوق الذكي
          </h1>

          <p className="text-xl md:text-2xl text-white/90 mb-12 drop-shadow-lg max-w-2xl mx-auto leading-relaxed">
            تصفح آلاف المنتجات من البائعين المحليين في مكان واحد
          </p>

          {/* أزرار التسجيل */}
          <div className="flex flex-col md:flex-row gap-4 justify-center items-center max-w-md mx-auto">
            <Link
              href="/auth"
              className="w-full md:w-auto bg-white text-gray-900 px-8 py-4 rounded-xl font-bold text-lg hover:shadow-2xl hover:shadow-white/30 transition-all duration-300 transform hover:scale-105"
            >
              تسجيل الدخول
            </Link>
            <Link
              href="/auth"
              className="w-full md:w-auto bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 transform hover:scale-105"
            >
              ابدأ الآن مجاناً
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-black/40 backdrop-blur-md text-white py-4 text-center">
        <p className="text-sm">© 2025 Bayn Bai. جميع الحقوق محفوظة.</p>
      </div>
    </div>
  );
}
