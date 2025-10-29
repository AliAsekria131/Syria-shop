// components/AvatarWithFallback.js
"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

// الصورة البديلة الافتراضية محلياً
const DEFAULT_AVATAR_SRC = "/avatar.svg"; 

export default function AvatarWithFallback({ user, width, height, className }) {
  // 1. نبدأ بمصدر الصورة الأصلي
  const initialSrc = user?.avatar_url || DEFAULT_AVATAR_SRC;
  const [imgSrc, setImgSrc] = useState(initialSrc);
  
  // 2. تحديث الحالة عند تغيير المستخدم (ضروري للتنقل بين المحادثات)
  useEffect(() => {
    setImgSrc(user?.avatar_url || DEFAULT_AVATAR_SRC);
  }, [user?.avatar_url]);

  // 3. دالة معالجة الخطأ
  const handleError = () => {
    // إذا فشل جلب الصورة (خطأ 400، 404، إلخ)، نقوم بتبديل المصدر
    // الشرط يمنع التكرار اللانهائي إذا فشلت الصورة البديلة أيضاً
    if (imgSrc !== DEFAULT_AVATAR_SRC) {
      setImgSrc(DEFAULT_AVATAR_SRC); 
    }
  };

  return (
    <Image
      src={imgSrc}
      alt="صورة المستخدم"
      width={width}
      height={height}
      className={className}
      onError={handleError}
      priority={false} // لا داعي لـ priority هنا
    />
  );
}