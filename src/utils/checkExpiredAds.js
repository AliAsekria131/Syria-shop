// utils/checkExpiredAds.js
export async function checkAndUpdateExpiredAds() {
  try {
    const response = await fetch('/api/update-expired-ads', {
      method: 'GET',
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('تم فحص الإعلانات المنتهية:', result);
      return result;
    }
  } catch (error) {
    console.error('خطأ في فحص الإعلانات:', error);
  }
}

// استخدم هذه الدالة في الصفحة الرئيسية
export async function useExpiredAdsChecker() {
  // فحص كل ساعة
  const lastCheck = localStorage.getItem('lastExpiredCheck');
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  
  if (!lastCheck || (now - parseInt(lastCheck)) > oneHour) {
    await checkAndUpdateExpiredAds();
    localStorage.setItem('lastExpiredCheck', now.toString());
  }
}