// utils/validation.js
// مساعدات للتحقق من صحة البيانات

/**
 * التحقق من صحة بيانات المنتج
 * @param {Object} productData - بيانات المنتج
 * @returns {Object} - نتيجة التحقق
 */
export const validateProduct = (productData) => {
  const errors = [];
  const { title, price, description, category, location } = productData;

  // التحقق من العنوان
  if (!title || title.trim().length < 3) {
    errors.push("عنوان المنتج يجب أن يكون 3 أحرف على الأقل");
  }
  if (title && title.length > 100) {
    errors.push("عنوان المنتج طويل جداً (100 حرف كحد أقصى)");
  }

  // التحقق من السعر
  if (!price || price <= 0) {
    errors.push("السعر يجب أن يكون أكبر من صفر");
  }
  if (price && price > 10000000) {
    errors.push("السعر كبير جداً");
  }

  // التحقق من الوصف
  if (!description || description.trim().length < 10) {
    errors.push("وصف المنتج يجب أن يكون 10 أحرف على الأقل");
  }
  if (description && description.length > 500) {
    errors.push("وصف المنتج طويل جداً (500 حرف كحد أقصى)");
  }

  // التحقق من الفئة
  if (!category || category.trim().length < 2) {
    errors.push("يجب اختيار فئة المنتج");
  }

  // التحقق من الموقع
  if (!location || location.trim().length < 2) {
    errors.push("يجب إدخال موقع المنتج");
  }

  return {
    isValid: errors.length === 0,
    errors: errors,
  };
};

/**
 * التحقق من صحة البريد الإلكتروني
 * @param {string} email - البريد الإلكتروني
 * @returns {boolean} - صحيح أم خطأ
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * التحقق من صحة كلمة المرور
 * @param {string} password - كلمة المرور
 * @returns {Object} - نتيجة التحقق
 */
export const validatePassword = (password) => {
  const errors = [];

  if (!password || password.length < 6) {
    errors.push("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
  }

  if (password && password.length > 50) {
    errors.push("كلمة المرور طويلة جداً");
  }

  return {
    isValid: errors.length === 0,
    errors: errors,
  };
};

/**
 * تنظيف النصوص من المسافات الزائدة
 * @param {string} text - النص
 * @returns {string} - النص المنظف
 */
export const cleanText = (text) => {
  if (!text) return "";
  return text.trim().replace(/\s+/g, " ");
};

/**
 * تحويل السعر إلى رقم صحيح
 * @param {string|number} price - السعر
 * @returns {number} - السعر كرقم صحيح
 */
export const parsePrice = (price) => {
  const parsed = parseInt(price);
  return isNaN(parsed) ? 0 : parsed;
};
