'use client'

import React, { createContext, useContext, ReactNode } from 'react';
import { useTranslations } from '@/lib/useTranslations';
import { TranslationsType, LanguageType } from '@/lib/translations';

// Create a context for the translations
interface TranslationContextType {
  language: LanguageType;
  translations: TranslationsType;
  isRTL: boolean;
  changeLanguage: (language: LanguageType) => void;
  t: (keyPath: string) => string;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

// Create a provider component
export const TranslationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const translationUtils = useTranslations();
  
  return (
    <TranslationContext.Provider value={translationUtils}>
      {children}
    </TranslationContext.Provider>
  );
};

// Create a hook to use the translations
export const useTranslation = () => {
  const context = useContext(TranslationContext);
  
  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  
  return context;
};