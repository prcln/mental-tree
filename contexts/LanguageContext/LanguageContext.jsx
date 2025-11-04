import { createContext, useContext, useState, useEffect } from 'react';
import { translations } from './LanguageLocales';

const LanguageContext = createContext({});

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    // Check localStorage first
    const saved = localStorage.getItem('mood-tree-language');
    if (saved) return saved;
    
    // Check browser language
    const browserLang = navigator.language.split('-')[0];
    return browserLang === 'vi' ? 'vi' : 'en';
  });

  useEffect(() => {
    localStorage.setItem('mood-tree-language', language);
  }, [language]);

  const timeLang = language === 'vi' ? 'vi-VN' : 'en-US'

  const t = (key) => {
    return translations[language][key] || key;
  };

  const switchLanguage = (lang) => {
    if (translations[lang]) {
      setLanguage(lang);
    }
  };

  const value = {
    language,
    switchLanguage,
    t,
    timeLang,
    availableLanguages: Object.keys(translations)
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};