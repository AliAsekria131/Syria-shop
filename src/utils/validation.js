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
 * التحقق من صحة البريد الإلكتروني.
 */
export const validateEmail = (email) => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(String(email).toLowerCase());
};

/**
 * التحقق من صحة كلمة المرور.
 */
export const validatePassword = (password) => {
  const errors = [];
  if (!password || password.length < PASSWORD_MIN) {
    errors.push(`كلمة المرور يجب أن تكون ${PASSWORD_MIN} أحرف على الأقل.`);
  }
  if (password?.length > PASSWORD_MAX) {
    errors.push(`كلمة المرور طويلة جداً (${PASSWORD_MAX} حرف كحد أقصى).`);
  }
  return { isValid: errors.length === 0, errors };
};

// الدوال المساعدة الأخرى (cleanText, parsePrice) ممتازة ولا تحتاج تعديل.
export const cleanText = (text) => {
  return text ? text.trim().replace(/\s+/g, " ") : "";
};

export const parsePrice = (price) => {
  const parsed = parseFloat(price);
  return isNaN(parsed) ? 0 : parsed;
};
