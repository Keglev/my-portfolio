import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslation from './locales/en.json';
import deTranslation from './locales/de.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslation },
      de: { translation: deTranslation }
    },
    lng: 'de',                              // default locale is German; portfolio targets a German-speaking market
    fallbackLng: 'en',
    interpolation: { escapeValue: false },  // React already escapes values; this prevents double-escaping
    compatibilityJSON: 'v3'                 // matches the plural-key format used in the locale JSON files
  });

export default i18n;
