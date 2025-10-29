import { z } from 'zod'

// مخططات التحقق
export const emailSchema = z
  .string()
  .min(1, "البريد الإلكتروني مطلوب")
  .email("البريد الإلكتروني غير صالح")

export const passwordSchema = z
  .string()
  .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل")
  .regex(/\d/, "يجب أن تحتوي على رقم واحد على الأقل")
  .regex(/[a-zA-Z]/, "يجب أن تحتوي على حرف واحد على الأقل")

export const fullNameSchema = z
  .string()
  .min(3, "الاسم يجب أن يكون 3 أحرف على الأقل")

// مخطط تسجيل الدخول
export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema
})

// مخطط التسجيل
export const signupSchema = z.object({
  fullName: fullNameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "كلمتا المرور غير متطابقتين",
  path: ["confirmPassword"]
})

// مخطط للتحقق من تطابق كلمات المرور
const updatePasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "كلمتا المرور غير متطابقتين",
  path: ["confirmPassword"]
});