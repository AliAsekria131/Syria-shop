import { NextResponse } from "next/server";
import { createMiddlewareClient } from "../lib/supabase"; // مسار lib خارج src

// ✅ الصفحات التي تحتاج تسجيل دخول
const protectedRoutes = [
  "/main",
  "/dashboard",
  "/favorites",
  "/add-product",
  "/settings",
];

// ✅ صفحات المصادقة (لا يجب الدخول إليها عند وجود جلسة)
const authRoutes = ["/auth", "/auth/reset-password", "/auth/update-password"];

// ✅ روابط redirect المسموحة (لحماية من open redirect)
const allowedRedirects = ["/main", "/dashboard", "/favorites", "/settings"];

/**
 * ✅ التحقق من أن redirect آمن داخليًا
 */
function isAllowedRedirect(redirectPath) {
  if (!redirectPath.startsWith("/")) return false;
  return allowedRedirects.some((allowed) => redirectPath.startsWith(allowed));
}

export async function middleware(request) {
  const response = NextResponse.next();
  const supabase = createMiddlewareClient(request, response);

  // 🔹 للحصول على الجلسة الحالية
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const { pathname } = request.nextUrl;

  // 🔒 المستخدم مسجل ويحاول الوصول إلى صفحات auth
  if (session && authRoutes.some((route) => pathname.startsWith(route))) {
    const redirectParam = request.nextUrl.searchParams.get("redirect");
    const safeRedirect =
      redirectParam && isAllowedRedirect(redirectParam)
        ? redirectParam
        : "/main";

    console.log(`➡️ [Redirecting Logged-in User] to: ${safeRedirect}`);
    return NextResponse.redirect(new URL(safeRedirect, request.url));
  }

  // 🚫 المستخدم غير مسجل ويحاول الوصول إلى صفحة محمية
  if (!session && protectedRoutes.some((route) => pathname.startsWith(route))) {
    const redirectUrl = new URL("/auth", request.url);
    redirectUrl.searchParams.set("redirect", pathname);
    console.log(`🚫 [Unauthorized] Redirecting to /auth?redirect=${pathname}`);
    return NextResponse.redirect(redirectUrl);
  }

  // ✅ إضافة بعض ترويسات الأمان
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  return response;
}

export const config = {
  matcher: [
    // 👇 سيعمل على كل الصفحات باستثناء الملفات الثابتة
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
