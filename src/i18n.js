/**
 * Initialises i18next with English and German locale resources and wires it
 * into React via react-i18next. Must be imported once at the application entry
 * point before any translated component renders.
 *
 * @module i18n
 * @see {@link https://www.i18next.com/overview/configuration-options i18next configuration options}
 * @see {@link https://react.i18next.com react-i18next documentation}
 */
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
  lng: 'de', // Default language: German per user's request
  fallbackLng: 'en',
    interpolation: { escapeValue: false }, // React already escapes values
    compatibilityJSON: 'v3' // For synchronous init
  });

export default i18n;
