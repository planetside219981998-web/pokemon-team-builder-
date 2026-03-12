import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enUI from './locales/en/ui.json';
import deUI from './locales/de/ui.json';

const savedLang = localStorage.getItem('language') ?? 'en';

i18n.use(initReactI18next).init({
  resources: {
    en: { ui: enUI },
    de: { ui: deUI },
  },
  lng: savedLang,
  fallbackLng: 'en',
  defaultNS: 'ui',
  interpolation: { escapeValue: false },
});

export default i18n;
