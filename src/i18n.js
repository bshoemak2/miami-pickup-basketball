import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import translationEN from './locales/en/translation.json';
import translationES from './locales/es/translation.json';

const resources = {
  en: { translation: translationEN },
  es: { translation: translationES },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // Explicitly set initial language
    fallbackLng: 'en',
    debug: true, // Enable debug logs for i18n
    interpolation: {
      escapeValue: false, // React handles escaping
    },
    react: {
      wait: true, // Wait for translations to load
    },
  });

export default i18n;