"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, AlertCircle, User } from "lucide-react";

export default function ProfileCompletionBanner({ user, supabase }) {
  const router = useRouter();
  const [showBanner, setShowBanner] = useState(false);
  const [profile, setProfile] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const checkProfile = async () => {
      if (!user) return;

      // التحقق من حالة الإخفاء المؤقت
      const dismissedUntil = localStorage.getItem('profileBannerDismissed');
      if (dismissedUntil) {
        const dismissTime = parseInt(dismissedUntil);
        const now = Date.now();
        // إخفاء لمدة 24 ساعة
        if (now < dismissTime + (24 * 60 * 60 * 1000)) {
          return;
        } else {
          localStorage.removeItem('profileBannerDismissed');
        }
      }

      // جلب بيانات الملف الشخصي
      const { data } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('id', user.id)
        .single();

      setProfile(data);

      // عرض البانر إذا كانت البيانات غير مكتملة
      if (!data?.full_name || !data?.phone) {
        setShowBanner(true);
      }
    };

    checkProfile();
  }, [user, supabase]);

  const handleDismiss = () => {
    // حفظ وقت الإخفاء
    localStorage.setItem('profileBannerDismissed', Date.now().toString());
    setDismissed(true);
    setShowBanner(false);
  };

  const handleComplete = () => {
    router.push('/settings');
  };

  if (!showBanner || dismissed) return null;

  return (
    <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm sm:text-base font-medium">
                {!profile?.full_name && !profile?.phone
                  ? "أكمل معلوماتك الشخصية لتحسين تجربتك"
                  : !profile?.full_name
                  ? "يرجى إضافة اسمك الكامل"
                  : "يرجى إضافة رقم هاتفك"}
              </p>
              <p className="text-xs sm:text-sm text-blue-100 mt-0.5">
                ستساعدنا هذه المعلومات في تقديم خدمة أفضل لك
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleComplete}
              className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium text-sm"
            >
              <User className="w-4 h-4" />
              <span>أكمل الآن</span>
            </button>
            <button
              onClick={handleDismiss}
              className="p-2 hover:bg-blue-400 rounded-lg transition-colors"
              aria-label="إخفاء مؤقتاً"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}