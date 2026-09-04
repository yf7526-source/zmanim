import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

const STORAGE_KEY = 'appLanguage';

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && ['en', 'he', 'both'].includes(saved)) return saved;
    } catch {}
    return 'both';
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, lang); } catch {}
  }, [lang]);

  const toggleLang = () => {
    setLang(prev => {
      if (prev === 'both') return 'en';
      if (prev === 'en') return 'he';
      return 'both';
    });
  };

  const showHe = lang === 'he' || lang === 'both';
  const showEn = lang === 'en' || lang === 'both';

  // Update <html> lang and dir when the selected language changes
  // 'he' → lang="he" dir="rtl"; 'en' → lang="en" dir="ltr"; 'both' → he (default dominant)
  useEffect(() => {
    const html = document.documentElement;
    if (lang === 'en') {
      html.lang = 'en';
      html.dir = 'ltr';
    } else {
      // 'he' and 'both' default to Hebrew (the app's primary language)
      html.lang = 'he';
      html.dir = 'rtl';
    }
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, showHe, showEn }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) return { lang: 'both', setLang: () => {}, toggleLang: () => {}, showHe: true, showEn: true };
  return ctx;
}