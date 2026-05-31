'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('ar');

  useEffect(() => {
    const savedLanguage = window.localStorage.getItem('dridoud-language');
    if (savedLanguage === 'en' || savedLanguage === 'ar') {
      setLanguage(savedLanguage);
    }
  }, []);

  useEffect(() => {
    const direction = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    document.documentElement.dir = direction;
    document.body.dir = direction;
    window.localStorage.setItem('dridoud-language', language);
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      direction: language === 'ar' ? 'rtl' : 'ltr',
      isArabic: language === 'ar',
      setLanguage,
      toggleLanguage: () => setLanguage((current) => (current === 'ar' ? 'en' : 'ar')),
    }),
    [language]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used inside LanguageProvider');
  }
  return context;
}
