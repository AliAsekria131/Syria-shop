"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function HomePage() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalUsers: 0
  });

  // التحقق من المصادقة وإعادة التوجيه
  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
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
        if (event === 'SIGNED_IN' && session?.user) {
          router.push('/main');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase, router]);

  // جلب الإحصائيات العامة
  const fetchStats = async () => {
    try {
      // جلب عدد المنتجات
      const { data: productsData, error: productsError } = await supabase
        .from("ads")
        .select("id", { count: 'exact' })
        .eq("status", "active");

      if (!productsError) {
        setStats(prev => ({ ...prev, totalProducts: productsData?.length || 0 }));
      }

      // يمكن إضافة المزيد من الإحصائيات هنا
      
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  // عرض شاشة التحميل أثناء التحقق من المصادقة
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🛍️</div>
          <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100">
      {/* شريط تنقل بسيط */}
      <nav className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🛍️</span>
              <span className="text-xl font-bold text-gray-800">متجر سوريا</span>
            </div>
            <div className="flex gap-3">
              <Link
                href="/login"
                className="text-gray-700 hover:text-blue-600 font-medium px-4 py-2 transition-colors"
              >
                تسجيل الدخول
              </Link>
              <Link
                href="/signup"
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                إنشاء حساب
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* القسم الرئيسي الترحيبي */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          {/* العنوان الرئيسي */}
          <div className="mb-8">
            <div className="text-8xl mb-6 animate-pulse">🛍️</div>
            <h1 className="text-5xl md:text-7xl font-bold text-gray-800 mb-6 leading-tight">
              مرحباً بك في
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                متجر سوريا
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              المنصة الأولى للتسوق الإلكتروني في سوريا
              <br />
              اكتشف أفضل المنتجات أو ابدأ ببيع منتجاتك الآن
            </p>
          </div>

          {/* الإحصائيات */}
          {stats.totalProducts > 0 && (
            <div className="mb-12">
              <div className="inline-flex items-center gap-8 bg-white/60 backdrop-blur-sm rounded-2xl px-8 py-4 shadow-lg">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    {stats.totalProducts}+
                  </div>
                  <div className="text-gray-600 text-sm">منتج متاح</div>
                </div>
                <div className="w-px h-12 bg-gray-300"></div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-1">
                    24/7
                  </div>
                  <div className="text-gray-600 text-sm">خدمة مستمرة</div>
                </div>
                <div className="w-px h-12 bg-gray-300"></div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-1">
                    100%
                  </div>
                  <div className="text-gray-600 text-sm">آمن وموثوق</div>
                </div>
              </div>
            </div>
          )}

          {/* أزرار الإجراء الرئيسية */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
            <Link
              href="/signup"
              className="group bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl group-hover:scale-110 transition-transform">🚀</span>
                <span>ابدأ رحلتك معنا</span>
              </div>
            </Link>
            <Link
              href="/login"
              className="group bg-white/80 backdrop-blur-sm text-gray-800 px-8 py-4 rounded-2xl font-bold text-lg border-2 border-gray-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl group-hover:scale-110 transition-transform">👋</span>
                <span>لديك حساب مسبقاً؟</span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* قسم الميزات */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-12">
            لماذا تختار متجر سوريا؟
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* ميزة 1 */}
            <div className="group bg-white/60 backdrop-blur-sm rounded-2xl p-8 text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">🛒</div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">تسوق سهل وسريع</h3>
              <p className="text-gray-600 leading-relaxed">
                تصفح آلاف المنتجات من مختلف الفئات واشتري بضغطة زر واحدة
              </p>
            </div>

            {/* ميزة 2 */}
            <div className="group bg-white/60 backdrop-blur-sm rounded-2xl p-8 text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">💰</div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">ابدأ البيع الآن</h3>
              <p className="text-gray-600 leading-relaxed">
                أضف منتجاتك واربح المال من خلال بيعها لآلاف المشترين
              </p>
            </div>

            {/* ميزة 3 */}
            <div className="group bg-white/60 backdrop-blur-sm rounded-2xl p-8 text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">🔒</div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">آمن وموثوق</h3>
              <p className="text-gray-600 leading-relaxed">
                معاملات آمنة ومشفرة مع حماية كاملة لبياناتك الشخصية
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* قسم الدعوة للانضمام */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-sm rounded-3xl p-12 border border-white/20">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
              هل أنت جاهز للبدء؟
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              انضم إلى آلاف المستخدمين الذين يثقون بمتجر سوريا
              <br />
              سواء كنت مشتري أو بائع، لدينا كل ما تحتاجه
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-3 rounded-xl font-bold text-lg hover:shadow-lg transition-all transform hover:-translate-y-0.5"
              >
                🎯 إنشاء حساب مجاني
              </Link>
              <Link
                href="/login"
                className="bg-white/80 backdrop-blur-sm text-gray-800 px-8 py-3 rounded-xl font-bold text-lg border border-gray-300 hover:border-gray-400 hover:shadow-lg transition-all transform hover:-translate-y-0.5"
              >
                🔑 تسجيل الدخول
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* الفوتر */}
      <footer className="bg-white/40 backdrop-blur-sm border-t border-white/20 py-8 px-4 mt-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-2xl">🛍️</span>
                <span className="text-xl font-bold text-gray-800">متجر سوريا</span>
              </div>
              <p className="text-gray-600 leading-relaxed">
                المنصة الأولى للتسوق الإلكتروني في سوريا. نربط البائعين بالمشترين 
                في بيئة آمنة وموثوقة.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-4">روابط سريعة</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/signup" className="text-gray-600 hover:text-blue-600 transition-colors">
                    إنشاء حساب
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="text-gray-600 hover:text-blue-600 transition-colors">
                    تسجيل الدخول
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-4">تواصل معنا</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-600">
                  <span>📧</span>
                  <span className="text-sm">support@syria-shop.com</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <span>📞</span>
                  <span className="text-sm">+963 XXX XXX XXX</span>
                </div>
                <div className="flex gap-3 mt-4">
                  <a href="#" className="text-2xl hover:scale-110 transition-transform">📘</a>
                  <a href="#" className="text-2xl hover:scale-110 transition-transform">📸</a>
                  <a href="#" className="text-2xl hover:scale-110 transition-transform">🐦</a>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 mt-8 pt-8 text-center">
            <p className="text-gray-500">
              © 2025 متجر سوريا. جميع الحقوق محفوظة.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}