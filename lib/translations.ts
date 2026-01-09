import arTranslations from '@/messages/ar.json';
import enTranslations from '@/messages/en.json';

// Define the type for the translations
export type TranslationsType = typeof arTranslations;
export type LanguageType = 'ar' | 'en';

// Function to get translations for a specific language
export const getTranslations = (language: LanguageType = 'ar') => {
  return language === 'ar' ? arTranslations : enTranslations;
};

// Function to get a translation by key path
export const getTranslationValue = (keyPath: string, translations: TranslationsType): string => {
  const keys = keyPath.split('.');
  let result: any = translations;
  
  for (const key of keys) {
    if (result && result[key] !== undefined) {
      result = result[key];
    } else {
      console.warn(`Translation key not found: ${keyPath}`);
      return keyPath;
    }
  }
  
  return result;
};

// Server-side translation function
export function getServerTranslation(keyPath: string, language: LanguageType = 'ar'): string {
  const translations = getTranslations(language);
  return getTranslationValue(keyPath, translations);
}