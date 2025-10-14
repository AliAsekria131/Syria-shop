// src/utils/compressImage.js

/**
 * ضغط صورة بطريقة بسيطة وموثوقة
 * @param {File} file - ملف الصورة الأصلي
 * @param {Object} options - خيارات الضغط
 * @returns {Promise<File>} - ملف الصورة المضغوطة
 */
 
 
 /**
 * ⚠️ ملاحظة:  
 * لتغيير قوة ضغط الصور، عدّل قيمة `quality` عند استدعاء الدالة.  
 * - قيمة أعلى (مثلاً 0.9) → جودة أفضل وحجم أكبر.  
 * - قيمة أقل (مثلاً 0.5) → ضغط أقوى وحجم أصغر، لكن قد تقل وضوح الصورة.  
 * مثال: compressImage(file, { quality: 0.6, maxWidth: 1200 });
 */

export async function compressImage(file, options = {}) {
  const {
    maxWidth = 1920,      // أقصى عرض
    maxHeight = 1080,     // أقصى ارتفاع
    quality = 0.5,        // جودة الصورة (0-1)
    type = 'image/jpeg'   // نوع الصورة الناتجة
  } = options;

  return new Promise((resolve, reject) => {
    // قراءة الملف
    const reader = new FileReader();
    
    reader.onerror = () => {
      reject(new Error('فشل قراءة الملف'));
    };
    
    reader.onload = (e) => {
      // إنشاء صورة
      const img = new Image();
      
      img.onerror = () => {
        reject(new Error('فشل تحميل الصورة'));
      };
      
      img.onload = () => {
        try {
          // حساب الأبعاد الجديدة
          let { width, height } = img;
          
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
          
          // إنشاء Canvas
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          
          // رسم الصورة
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // تحويل إلى Base64
          const dataUrl = canvas.toDataURL(type, quality);
          
          // تحويل Base64 إلى Blob
          const base64Data = dataUrl.split(',')[1];
          const byteString = atob(base64Data);
          const arrayBuffer = new ArrayBuffer(byteString.length);
          const uint8Array = new Uint8Array(arrayBuffer);
          
          for (let i = 0; i < byteString.length; i++) {
            uint8Array[i] = byteString.charCodeAt(i);
          }
          
          const blob = new Blob([arrayBuffer], { type });
          
          // إنشاء File جديد
          const compressedFile = new File([blob], file.name, {
            type: type,
            lastModified: Date.now()
          });
          
          console.log(`ضغط الصورة: ${(file.size / 1024).toFixed(2)} KB → ${(compressedFile.size / 1024).toFixed(2)} KB`);
          
          resolve(compressedFile);
          
        } catch (err) {
          reject(new Error('فشل ضغط الصورة: ' + err.message));
        }
      };
      
      img.src = e.target.result;
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * ضغط عدة صور
 * @param {File[]} files - مصفوفة ملفات الصور
 * @param {Object} options - خيارات الضغط
 * @returns {Promise<File[]>} - مصفوفة الصور المضغوطة
 */
export async function compressMultipleImages(files, options = {}) {
  const compressedFiles = [];
  
  for (const file of files) {
    try {
      const compressed = await compressImage(file, options);
      compressedFiles.push(compressed);
    } catch (err) {
      console.error('خطأ في ضغط الصورة:', err);
      // استخدم الصورة الأصلية إذا فشل الضغط
      compressedFiles.push(file);
    }
  }
  
  return compressedFiles;
}