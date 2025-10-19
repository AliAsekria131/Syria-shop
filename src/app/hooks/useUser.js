// src/hooks/useUser.js
"use client";

import { useState, useEffect } from "react";
import { createClient } from '../../../lib/supabase';

/**
 * Custom Hook لجلب بيانات المستخدم الحالي
 * @returns {Object} - { user, loading, error, refreshUser }
 */
export function useUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUser = async () => {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();
      
      // جلب بيانات المستخدم من المصادقة
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error("Auth error:", authError.message);
        setError("خطأ في المصادقة");
        setUser(null);
        return;
      }

      if (!authUser) {
        setUser(null);
        return;
      }

      // جلب بيانات الملف الشخصي من قاعدة البيانات
      const { data: userProfile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (profileError) {
        if (process.env.NODE_ENV === 'development') {
          console.error("Profile fetch error:", profileError.message);
        }
        setError("خطأ في جلب بيانات الملف الشخصي");
        setUser(null);
        return;
      }

      setUser(userProfile);
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Unexpected error in useUser:", err);
      }
      setError("حدث خطأ غير متوقع");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  // دالة لإعادة جلب بيانات المستخدم (مفيدة بعد التحديث)
  const refreshUser = () => {
    fetchUser();
  };

  return { 
    user, 
    loading, 
    error, 
    refreshUser 
  };
}

/**
 * Custom Hook للتحقق من حالة المصادقة فقط (بدون بيانات الملف الشخصي)
 * @returns {Object} - { isAuthenticated, loading }
 */
export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient();
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error("Auth check error:", error.message);
          setIsAuthenticated(false);
        } else {
          setIsAuthenticated(!!user);
        }
      } catch (err) {
        console.error("Unexpected auth check error:", err);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  return { isAuthenticated, loading };
}