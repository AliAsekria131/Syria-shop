// src/app/about/page.js
"use client";

import AppLayout from "../components/AppLayout";

export default function AboutPage() {
  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">من نحن</h1>

        <div className="space-y-6 text-gray-700 dark:text-gray-200 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-100">عن المنصة</h2>
            <p>
              منصة إلكترونية تربط البائعين والمشترين في مكان واحد. نهدف إلى توفير
              تجربة بيع وشراء سهلة وآمنة للجميع.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-100">خدماتنا</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>عرض وبيع المنتجات بسهولة</li>
              <li>تصفح آلاف المنتجات من مختلف الفئات</li>
              <li>التواصل المباشر بين البائع والمشتري</li>
              <li>نظام تقييمات موثوق</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-100">رؤيتنا</h2>
            <p>
              أن نصبح المنصة الأولى للتجارة الإلكترونية في المنطقة، حيث يمكن
              للجميع البيع والشراء بثقة وأمان.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-100">تواصل معنا</h2>
            <div className="space-y-2">
              <p>البريد الإلكتروني: aliasekria263@gmail.com</p>
              <p>الهاتف: +963 996188608</p>
              <p>العنوان: اللاذقية، سوريا</p>
            </div>
          </section>

          <section className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              جميع الحقوق محفوظة © 2025
            </p>
          </section>
        </div>
      </div>
    </AppLayout>
  );
}