import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { translations, Language, Direction } from "@/i18n/translations";
import { supabase } from "@/integrations/supabase/client";

interface LanguageContextType {
  language: Language;
  direction: Direction;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("language");
    return (saved as Language) || "en";
  });
  const [userId, setUserId] = useState<string | null>(null);
  const hasFetchedFromDb = useRef(false);

  const direction: Direction = language === "ar" ? "rtl" : "ltr";

  // Listen to auth state to get user id
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const newUserId = session?.user?.id ?? null;
        setUserId(newUserId);
        if (!newUserId) {
          hasFetchedFromDb.current = false;
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch language preference from DB when user logs in
  useEffect(() => {
    if (!userId || hasFetchedFromDb.current) return;

    const fetchPreference = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("language_preference")
        .eq("user_id", userId)
        .maybeSingle();

      if (data?.language_preference && (data.language_preference === "en" || data.language_preference === "ar")) {
        setLanguageState(data.language_preference as Language);
      }
      hasFetchedFromDb.current = true;
    };

    fetchPreference();
  }, [userId]);

  // Apply language to DOM
  useEffect(() => {
    localStorage.setItem("language", language);
    document.documentElement.dir = direction;
    document.documentElement.lang = language;
    
    if (language === "ar") {
      document.documentElement.classList.add("font-arabic");
    } else {
      document.documentElement.classList.remove("font-arabic");
    }
  }, [language, direction]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);

    // Persist to DB if logged in
    if (userId) {
      supabase
        .from("profiles")
        .update({ language_preference: lang })
        .eq("user_id", userId)
        .then();
    }
  };

  const toggleLanguage = () => {
    const newLang = language === "en" ? "ar" : "en";
    setLanguage(newLang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, direction, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
