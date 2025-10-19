"use client";

import Image from 'next/image';
import { useState } from 'react';

export default function UserAvatar({ 
  src, 
  alt = "مستخدم", 
  size = 40,
  className = "" 
}) {
  const [imgSrc, setImgSrc] = useState(src || "/avatar.svg");
  const [error, setError] = useState(false);

  // إذا فشل التحميل، نستخدم الصورة الافتراضية
  const handleError = () => {
    if (!error) {
      setImgSrc("/avatar.svg");
      setError(true);
    }
  };

  return (
    <div 
      className={`relative flex-shrink-0 ${className}`} 
      style={{ width: size, height: size }}
    >
      <Image
        src={imgSrc}
        alt={alt}
        fill
        className="rounded-full object-cover bg-gray-100 dark:bg-gray-800"
        onError={handleError}
        unoptimized={imgSrc?.startsWith('http') || imgSrc === "/avatar.svg"}
        sizes={`${size}px`}
      />
    </div>
  );
}