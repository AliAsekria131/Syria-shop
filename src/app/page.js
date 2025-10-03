"use client";

import { useEffect, useState } from "react";
import { createClient } from '../../lib/supabase';
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [currentSection, setCurrentSection] = useState(0);

  const sections = [
    {
      id: 1,
      title: "اكتشف عالم التسوق الذكي",
      description: "تصفح آلاف المنتجات من البائعين المحليين في مكان واحد",
      gradient: "from-blue-500 to-purple-600",
      image: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1200&auto=format&fit=crop&q=80"
    },
    {
      id: 2,
      title: "ابدأ البيع واربح",
      description: "أضف منتجاتك وابدأ بالربح من خلال منصتنا الآمنة",
      gradient: "from-green-500 to-teal-600",
      image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&auto=format&fit=crop&q=80"
    },
    {
      id: 3,
      title: "معاملات آمنة وموثوقة",
      description: "تسوق بثقة مع نظام الحماية والتشفير الكامل",
      gradient: "from-orange-500 to-red-600",
      image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1200&auto=format&fit=crop&q=80"
    }
  ];

  // التحقق من المصادقة وإعادة التوجيه
  useEffect(() => {
    const checkAuth = async () => {
      // تجنب redirect loops
      if (pathname !== '/') {
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (user && !error) {
          router.replace('/main');
          return;
        }
        
        setLoading(false);
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error("Error checking auth:", error);
        }
        setLoading(false);
      }
    };

    checkAuth();

    // مراقبة تغييرات المصادقة
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session?.user && pathname === '/') {
          router.replace('/main');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [router, pathname]);

  // نظام التمرير بين الصفحات - محسّن
  useEffect(() => {
    let isScrolling = false;
    let scrollTimeout;

    const handleWheel = (e) => {
      e.preventDefault();
      
      if (isScrolling) return;
      
      if (e.deltaY > 30 && currentSection < sections.length - 1) {
        isScrolling = true;
        setCurrentSection(prev => prev + 1);
      } else if (e.deltaY < -30 && currentSection > 0) {
        isScrolling = true;
        setCurrentSection(prev => prev - 1);
      }

      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        isScrolling = false;
      }, 1000);
    };

    let touchStartY = 0;
    const handleTouchStart = (e) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e) => {
      if (isScrolling) return;

      const touchEndY = e.changedTouches[0].clientY;
      const diff = touchStartY - touchEndY;
      
      if (diff > 50 && currentSection < sections.length - 1) {
        isScrolling = true;
        setCurrentSection(prev => prev + 1);
      } else if (diff < -50 && currentSection > 0) {
        isScrolling = true;
        setCurrentSection(prev => prev - 1);
      }

      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        isScrolling = false;
      }, 1000);
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
      clearTimeout(scrollTimeout);
    };
  }, [currentSection, sections.length]);

  // معالجة ضغط المفاتيح
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown' && currentSection < sections.length - 1) {
        setCurrentSection(prev => prev + 1);
      } else if (e.key === 'ArrowUp' && currentSection > 0) {
        setCurrentSection(prev => prev - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSection, sections.length]);

  // عرض شاشة التحميل
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-gray-900">
      {/* شريط التنقل */}
      <nav className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-white/10 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🛍️</span>
              <span className="text-2xl font-bold text-white">Bayn Bai</span>
            </div>
            <div className="flex gap-4">
              <Link
                href="/auth"
                className="text-white hover:text-blue-300 font-medium px-6 py-2.5 transition-colors text-lg"
              >
                تسجيل الدخول
              </Link>
              <Link
                href="/auth"
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2.5 rounded-xl hover:shadow-lg hover:shadow-blue-500/50 transition-all font-medium text-lg"
              >
                ابدأ الآن
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* المؤشر الجانبي للصفحات */}
      <div className="hidden md:flex fixed right-8 top-1/2 -translate-y-1/2 z-50 flex-col gap-3">
        {sections.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSection(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              currentSection === index 
                ? 'bg-white scale-125' 
                : 'bg-white/40 hover:bg-white/60'
            }`}
            aria-label={`الانتقال إلى القسم ${index + 1}`}
          />
        ))}
      </div>

      {/* الصفحات */}
      <div 
        className="h-full transition-transform duration-1000 ease-in-out"
        style={{ transform: `translateY(-${currentSection * 100}vh)` }}
      >
        {sections.map((section, index) => (
          <section 
            key={section.id}
            className="h-screen w-full flex items-center justify-center relative"
          >
            {/* الخلفية المتدرجة */}
            <div className={`absolute inset-0 bg-gradient-to-br ${section.gradient} opacity-40`} />
            
            {/* صورة الخلفية */}
            <div className="absolute inset-0">
              <Image
                src={section.image}
                alt={section.title}
                fill
                className="object-cover opacity-60"
                priority={index === 0}
                quality={80}
                sizes="100vw"
              />
            </div>

            {/* Overlay مظلم */}
            <div className="absolute inset-0 bg-black/30" />

            {/* المحتوى */}
            <div className="relative z-10 max-w-5xl mx-auto px-8 text-center">
              <div 
                className="transform transition-all duration-1000 delay-200"
                style={{
                  opacity: currentSection === index ? 1 : 0,
                  transform: currentSection === index ? 'translateY(0)' : 'translateY(30px)'
                }}
              >
                <h1 className="text-4xl md:text-7xl font-bold text-white mb-6 drop-shadow-2xl leading-tight">
                  {section.title}
                </h1>
                <p className="text-lg md:text-3xl text-white/90 mb-12 drop-shadow-lg max-w-3xl mx-auto leading-relaxed">
                  {section.description}
                </p>

                {/* الأزرار */}
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

            {/* سهم للأسفل */}
            {index < sections.length - 1 && (
              <button
                onClick={() => setCurrentSection(prev => prev + 1)}
                className="absolute bottom-12 left-1/2 -translate-x-1/2 text-white/70 hover:text-white transition-all animate-bounce z-20"
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
            <div className="absolute bottom-8 left-8 text-white/50 text-lg font-medium z-20">
              {index + 1} / {sections.length}
            </div>
          </section>
        ))}
      </div>

      {/* Footer */}
      {currentSection === sections.length - 1 && (
        <div className="fixed bottom-0 left-0 right-0 bg-black/40 backdrop-blur-md text-white py-4 text-center transition-opacity duration-500 z-20">
          <p className="text-sm">© 2025 Bayn Bai. جميع الحقوق محفوظة.</p>
        </div>
      )}
    </div>
  );
}