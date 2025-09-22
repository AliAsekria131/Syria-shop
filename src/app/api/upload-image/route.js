import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    // 1. التحقق من وجود مفتاح API
    const IMGBB_API_KEY = process.env.IMGBB_API_KEY;
    if (!IMGBB_API_KEY) {
      console.error("Missing IMGBB_API_KEY in environment variables");
      return NextResponse.json(
        { error: "خطأ في الإعدادات الداخلية" },
        { status: 500 }
      );
    }

    // 2. الحصول على البيانات من الطلب
    const formData = await req.formData();
    const image = formData.get("image");

    // 3. التحقق من وجود الصورة
    if (!image) {
      return NextResponse.json(
        { error: "لم يتم اختيار صورة" },
        { status: 400 }
      );
    }

    // 4. التحقق من نوع الملف
    if (!image.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "يجب أن يكون الملف صورة" },
        { status: 400 }
      );
    }

    // 5. التحقق من حجم الصورة (5MB كحد أقصى)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (image.size > maxSize) {
      return NextResponse.json(
        { error: "حجم الصورة كبير جداً (الحد الأقصى 5MB)" },
        { status: 400 }
      );
    }

    // 6. إعداد البيانات للرفع
    const uploadData = new FormData();
    uploadData.append("image", image);

    // 7. رفع الصورة إلى ImgBB
    const response = await fetch(
      `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
      {
        method: "POST",
        body: uploadData,
      }
    );

    // 8. التحقق من استجابة الخادم
    if (!response.ok) {
      console.error("ImgBB API error:", response.status);
      return NextResponse.json({ error: "فشل في رفع الصورة" }, { status: 500 });
    }

    // 9. معالجة البيانات المُرجعة
    const data = await response.json();

    if (!data.success || !data.data?.url) {
      console.error("ImgBB response error:", data);
      return NextResponse.json(
        { error: "فشل في معالجة الصورة" },
        { status: 500 }
      );
    }

    // 10. إرجاع رابط الصورة
    return NextResponse.json({
      success: true,
      url: data.data.url,
      message: "تم رفع الصورة بنجاح",
    });
  } catch (error) {
    // معالجة الأخطاء غير المتوقعة
    console.error("Upload error:", error);
    return NextResponse.json({ error: "حدث خطأ غير متوقع" }, { status: 500 });
  }
}
