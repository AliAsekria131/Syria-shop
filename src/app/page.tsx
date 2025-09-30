// صفحة الاستقبال الرئيسية - محسّنة أمنياً
"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

export default function HomePage() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
  });
  const [currentSection, setCurrentSection] = useState(0);

  const sections = [
    {
      id: 1,
      emoji: "",
      title: "اكتشف عالم التسوق الذكي",
      description: "تصفح آلاف المنتجات من البائعين المحليين في مكان واحد",
      gradient: "from-blue-500 to-purple-600",
      image: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800&auto=format&fit=crop"
    },
    {
      id: 2,
      emoji: "",
      title: "ابدأ البيع واربح",
      description: "أضف منتجاتك وابدأ بالربح من خلال منصتنا الآمنة",
      gradient: "from-green-500 to-teal-600",
      image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&auto=format&fit=crop"
    },
    {
      id: 3,
      emoji: "",
      title: "معاملات آمنة وموثوقة",
      description: "تسوق بثقة مع نظام الحماية والتشفير الكامل",
      gradient: "from-orange-500 to-red-600",
      image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&auto=format&fit=crop"
    }
  ];

  // التحقق من المصادقة وإعادة التوجيه - محسّن أمنياً
  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        // تجنب redirect loops
        if (pathname !== '/') {
          setLoading(false);
          return;
        }

        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (user && !error) {
          // المستخدم مسجل دخول، وجهه لصفحة المنتجات
          router.push('/main');
          return;
        }
        
        // المستخدم غير مسجل، اجلب الإحصائيات العامة
        await fetchStats();
        setLoading(false);
        
      } catch (error) {
        console.error("Error checking auth:", error);
        setLoading(false);
      }
    };

    checkAuthAndRedirect();

    // مراقبة تغييرات المصادقة
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session?.user && pathname === '/') {
          router.push('/main');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase, router, pathname]);

  // جلب الإحصائيات العامة - محسّن أمنياً
  const fetchStats = async () => {
    try {
      // جلب عدد المنتجات فقط (count) دون جلب البيانات الفعلية
      // يجب التأكد من أن RLS مفعّل على جدول ads
      const { count, error } = await supabase
        .from("ads")
        .select("*", { count: 'exact', head: true })
        .eq("status", "active");

      if (error) {
        console.error("Error fetching stats:", error);
        // لا نعرض رسالة خطأ للمستخدم لتجنب كشف معلومات النظام
        return;
      }

      // تحديد حد أقصى لعرض الإحصائيات (لتجنب كشف معلومات دقيقة عن النظام)
      const displayCount = count ? Math.min(count, 9999) : 0;
      setStats(prev => ({ ...prev, totalProducts: displayCount }));
      
    } catch (error) {
      console.error("Error fetching stats:", error);
      // لا نعرض رسالة خطأ للمستخدم
    }
  };

  // نظام التمرير بين الصفحات
  useEffect(() => {
    const handleWheel = (e) => {
      e.preventDefault();
      
      if (e.deltaY > 50 && currentSection < sections.length - 1) {
        setCurrentSection(prev => prev + 1);
      } else if (e.deltaY < -50 && currentSection > 0) {
        setCurrentSection(prev => prev - 1);
      }
    };

    let touchStartY = 0;
    const handleTouchStart = (e) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e) => {
      const touchEndY = e.changedTouches[0].clientY;
      const diff = touchStartY - touchEndY;
      
      if (diff > 50 && currentSection < sections.length - 1) {
        setCurrentSection(prev => prev + 1);
      } else if (diff < -50 && currentSection > 0) {
        setCurrentSection(prev => prev - 1);
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [currentSection, sections.length]);

  const scrollToNext = () => {
    if (currentSection < sections.length - 1) {
      setCurrentSection(prev => prev + 1);
    }
  };

  // عرض شاشة التحميل أثناء التحقق من المصادقة
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-gray-900">
      {/* شريط التنقل الثابت - يظهر فقط في الشاشات الكبيرة */}
      <nav className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-white/10 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🛍️</span>
              <span className="text-2xl font-bold text-white">متجر سوريا</span>
            </div>
            <div className="flex gap-4">
              <Link
                href="/login"
                className="text-white hover:text-blue-300 font-medium px-6 py-2.5 transition-colors text-lg whitespace-nowrap"
              >
                تسجيل الدخول
              </Link>
              <Link
                href="/signup"
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2.5 rounded-xl hover:shadow-lg hover:shadow-blue-500/50 transition-all font-medium text-lg whitespace-nowrap"
              >
                إنشاء حساب
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* الصفحات */}
      <div 
        className="h-full transition-transform duration-1000 ease-in-out"
        style={{ 
          transform: `translateY(-${currentSection * 100}vh)`,
        }}
      >
        {sections.map((section, index) => (
          <section 
            key={section.id}
            className="h-screen w-full flex items-center justify-center relative"
          >
            {/* الخلفية المتدرجة */}
            <div className={`absolute inset-0 bg-gradient-to-br ${section.gradient} opacity-40`}></div>
            
            {/* صورة الخلفية */}
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-60"
              style={{ backgroundImage: `url(${section.image})` }}
            ></div>

            {/* المحتوى */}
            <div className="relative z-10 max-w-5xl mx-auto px-8 text-center">
              <div 
                className="transform transition-all duration-1000 delay-200"
                style={{
                  opacity: currentSection === index ? 1 : 0,
                  transform: currentSection === index ? 'translateY(0)' : 'translateY(30px)'
                }}
              >
                <div className="text-8xl mb-8 animate-bounce-slow">
                  {section.emoji}
                </div>
                <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 drop-shadow-2xl">
                  {section.title}
                </h1>
                <p className="text-1xl md:text-3xl text-white/90 mb-12 drop-shadow-lg max-w-3xl mx-auto leading-relaxed">
                  {section.description}
                </p>

                {/* الأزرار - تظهر فقط في شاشات الهاتف */}
                <div className="md:hidden flex flex-col gap-4 w-full max-w-xs mx-auto">
                  <Link
                    href="/login"
                    className="bg-white text-gray-900 px-8 py-4 rounded-xl font-bold text-lg hover:shadow-2xl hover:shadow-white/30 transition-all duration-300 transform hover:scale-105 w-full text-center"
                  >
                    تسجيل الدخول
                  </Link>
                  <Link
                    href="/signup"
                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 transform hover:scale-105 w-full text-center"
                  >
                    إنشاء حساب
                  </Link>
                </div>
              </div>
            </div>

            {/* سهم للأسفل */}
            {index < sections.length - 1 && (
              <button
                onClick={scrollToNext}
                className="absolute bottom-12 left-1/2 -translate-x-1/2 text-white/70 hover:text-white transition-all animate-bounce"
                aria-label="التالي"
              >
                <svg 
                  className="w-12 h-12" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M19 9l-7 7-7-7" 
                  />
                </svg>
              </button>
            )}

            {/* رقم الصفحة */}
            <div className="absolute bottom-8 right-8 text-white/50 text-lg font-medium">
              {index + 1} / {sections.length}
            </div>
          </section>
        ))}
      </div>

      {/* Footer ثابت في الأسفل */}
      {currentSection === sections.length - 1 && (
        <div 
          className="fixed bottom-0 left-0 right-0 bg-black/40 backdrop-blur-md text-white py-4 text-center transition-opacity duration-500"
          style={{
            opacity: currentSection === sections.length - 1 ? 1 : 0
          }}
        >
          <p className="text-sm">© 2025 متجر سوريا. جميع الحقوق محفوظة.</p>
        </div>
      )}

      <style jsx>{`
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}