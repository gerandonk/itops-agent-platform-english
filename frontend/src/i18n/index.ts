import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import zhCN from './locales/zh-CN.json';
import enUS from './locales/en.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      'zh-CN': { translation: zhCN },
      'en': { translation: enUS },
    },
    fallbackLng: 'en',
    lng: 'en',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage'],
      caches: ['localStorage'],
      lookupLocalStorage: 'itops-lang',
    },
  });

// Force English as default unless user explicitly switches via LanguageSwitcher
if (typeof localStorage !== 'undefined' && !localStorage.getItem('itops-lang')) {
  localStorage.setItem('itops-lang', 'en');
}

export default i18n;
