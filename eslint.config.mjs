
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import unusedImports from "eslint-plugin-unused-imports";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  {
    plugins: {
      "unused-imports": unusedImports,
    },
    rules: {
      "unused-imports/no-unused-imports": "error", // يعرض خطأ للواردات غير المستخدمة
      "unused-imports/no-unused-vars": [
        "warn", // تحذير للمتغيرات غير المستخدمة
        {
          vars: "all",
          varsIgnorePattern: "^_", // تجاهل المتغيرات التي تبدأ بـ _
          args: "after-used",
          argsIgnorePattern: "^_", // تجاهل الوسائط التي تبدأ بـ _
        },
      ],
    },
  },
];

export default eslintConfig;
