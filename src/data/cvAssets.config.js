/**
 * @file cvAssets.config.js
 * @module data/cvAssets.config
 * @summary Language -> CV PDF asset path mapping.
 * @enterprise Single source of truth for the locale-conditional CV
 * download, per the i18n standing decision: the mapping lives in one
 * place, not scattered ternaries. Previously duplicated independently in
 * Hero.js and SidebarMenu.js, which had drifted to two different matching
 * rules (exact 'de' equality vs. a 'de' prefix check) -- a real
 * inconsistency for regional codes like 'de-DE'. getCvFile() standardizes
 * on the prefix check so both consumers resolve regional German variants
 * to the German PDF.
 */

const CV_ASSETS = {
  de: '/Carlos_Keglevich_Lebenslauf_DE.pdf',
  en: '/Carlos_Keglevich_CV_EN.pdf',
};

/**
 * @param {string} language - i18next language code (e.g. 'de', 'de-DE', 'en')
 * @returns {string} Public path to the matching CV PDF
 */
export const getCvFile = (language) =>
  (language || '').toLowerCase().startsWith('de') ? CV_ASSETS.de : CV_ASSETS.en;

export default CV_ASSETS;
