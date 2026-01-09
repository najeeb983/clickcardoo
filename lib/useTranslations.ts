'use client';

import { useEffect, useState } from 'react';
import arTranslations from '@/messages/ar.json';
import enTranslations from '@/messages/en.json';
import { TranslationsType, LanguageType, getTranslationValue } from './translations';

export const useTranslations = () => {
  const [language, setLanguage] = useState<LanguageType>('ar');
  const [translations, setTranslations] = useState<TranslationsType>(arTranslations);
  const [isRTL, setIsRTL] = useState(true);

  // Load the language preference from localStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('preferredLanguage') as LanguageType | null;
      
      if (savedLanguage) {
        setLanguage(savedLanguage);
        setTranslations(savedLanguage === 'ar' ? arTranslations : enTranslations);
        setIsRTL(savedLanguage === 'ar');
      } else {
        // Default to Arabic if no language preference is found
        setLanguage('ar');
        setTranslations(arTranslations);
        setIsRTL(true);
      }
    }
  }, []);

  // Function to change the language
  const changeLanguage = (newLanguage: LanguageType) => {
    setLanguage(newLanguage);
    setTranslations(newLanguage === 'ar' ? arTranslations : enTranslations);
    setIsRTL(newLanguage === 'ar');
    
    // Save the language preference to localStorage
    localStorage.setItem('preferredLanguage', newLanguage);
    
    // Update the HTML attributes
    if (typeof document !== 'undefined') {
      document.documentElement.lang = newLanguage;
      document.documentElement.dir = newLanguage === 'ar' ? 'rtl' : 'ltr';
      
      if (newLanguage === 'ar') {
        document.documentElement.classList.add('rtl-mode');
        document.documentElement.classList.remove('ltr-mode');
      } else {
        document.documentElement.classList.add('ltr-mode');
        document.documentElement.classList.remove('rtl-mode');
      }
    }
  };

  // Function to get a translation by key path
  const t = (keyPath: string): string => {
    return getTranslationValue(keyPath, translations);
  };

  return {
    language,
    translations,
    isRTL,
    changeLanguage,
    t
  };
};