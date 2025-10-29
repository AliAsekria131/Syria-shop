// src/app/main/components/CategoryFilter.js
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

const CATEGORIES = [
  "الكل",
  "إلكترونيات",
  "أثاث",
  "ملابس",
  "كتب",
  "ألعاب",
  "سيارات",
  "مركبات",
];

export function CategoryFilter({ onAdsUpdate, onError }) {
  const [selectedCategory, setSelectedCategory] = useState("الكل");

  const handleCategoryClick = async (category) => {
    setSelectedCategory(category);
    onError(null);

    try {
      if (category === "الكل") {
        const { data, error } = await supabase.rpc("get_all_ads");
        if (error) throw error;
        onAdsUpdate(data || []);
      } else {
        const { data, error } = await supabase
          .from("ads")
          .select("*")
          .eq("category", category);
        if (error) throw error;
        onAdsUpdate(data || []);
      }
    } catch (err) {
      console.error("❌ خطأ أثناء الجلب:", err);
      onError("فشل تحميل الإعلانات. حاول لاحقًا.");
    }
  };

  return (
    <div className="col-span-full mb-4">
      <div className="flex space-x-2 overflow-x-auto pb-2">
        {CATEGORIES.map((category) => (
          <button
            key={category}
            onClick={() => handleCategoryClick(category)}
            className={`flex-shrink-0 px-3 py-1 rounded-sm transition-colors whitespace-nowrap focus:outline-none ${
              selectedCategory === category
                ? "bg-red-600 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-red-500 hover:text-white"
            }`}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
}