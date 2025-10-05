// utils/validation.js

// تعريف الثوابت لتسهيل التعديل
const PRODUCT_TITLE_MIN = 3;
const PRODUCT_TITLE_MAX = 100;
const PRODUCT_DESC_MIN = 10;
const PRODUCT_DESC_MAX = 500;
const PASSWORD_MIN = 6;
const PASSWORD_MAX = 50;

/**
 * التحقق من صحة بيانات المنتج.
 */
export const validateProduct = ({ title, price, description, category, location }) => {
  const errors = [];

  if (!title || title.trim().length < PRODUCT_TITLE_MIN) {
    errors.push(`عنوان المنتج يجب أن يكون ${PRODUCT_TITLE_MIN} أحرف على الأقل.`);
  }
  if (title?.length > PRODUCT_TITLE_MAX) {
    errors.push(`عنوان المنتج طويل جداً (${PRODUCT_TITLE_MAX} حرف كحد أقصى).`);
  }
  // ... (بقية قواعد التحقق تبقى كما هي)

  return { isValid: errors.length === 0, errors };
};

/**
 * التحقق من صحة البريد الإلكتروني
 */
export function validateEmail(email) {
  if (!email) {
    return { valid: false, error: 'البريد الإلكتروني مطلوب' }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'البريد الإلكتروني غير صحيح' }
  }

  // الحد الأقصى للطول
  if (email.length > 255) {
    return { valid: false, error: 'البريد الإلكتروني طويل جداً' }
  }

  return { valid: true }
}

/**
 * التحقق من قوة كلمة المرور
 * - 8 أحرف على الأقل
 * - تحتوي على أحرف وأرقام
 */
export function validatePassword(password) {
  if (!password) {
    return { valid: false, error: 'كلمة المرور مطلوبة' }
  }

  if (password.length < 8) {
    return { valid: false, error: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' }
  }

  if (password.length > 72) {
    return { valid: false, error: 'كلمة المرور طويلة جداً (الحد الأقصى 72 حرف)' }
  }

  const hasLetter = /[a-zA-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)

  if (!hasLetter || !hasNumber) {
    return { valid: false, error: 'كلمة المرور يجب أن تحتوي على أحرف وأرقام' }
  }

  return { valid: true }
}

/**
 * التحقق من تطابق كلمتي المرور
 */
export function validatePasswordMatch(password, confirmPassword) {
  if (password !== confirmPassword) {
    return { valid: false, error: 'كلمتا المرور غير متطابقتين' }
  }
  return { valid: true }
}

/**
 * تنظيف المدخلات من XSS
 * إزالة HTML tags والأحرف الخطيرة
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') return input

  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim()
}

/**
 * التحقق من رقم الهاتف (اختياري)
 */
export function validatePhone(phone) {
  if (!phone) {
    return { valid: true } // Phone is optional
  }

  // إزالة المسافات والرموز
  const cleaned = phone.replace(/[\s\-\(\)]/g, '')

  // التحقق من أن الرقم يحتوي على أرقام فقط وطوله مناسب
  if (!/^\+?[0-9]{8,15}$/.test(cleaned)) {
    return { valid: false, error: 'رقم الهاتف غير صحيح' }
  }

  return { valid: true }
}

/**
 * التحقق من الاسم الكامل
 */
export function validateFullName(name) {
  if (!name) {
    return { valid: false, error: 'الاسم الكامل مطلوب' }
  }

  const trimmed = name.trim()

  if (trimmed.length < 2) {
    return { valid: false, error: 'الاسم قصير جداً' }
  }

  if (trimmed.length > 100) {
    return { valid: false, error: 'الاسم طويل جداً' }
  }

  return { valid: true }
}